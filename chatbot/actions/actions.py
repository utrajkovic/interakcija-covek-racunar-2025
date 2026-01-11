from typing import Any, Text, Dict, List, Optional, Tuple
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import requests

API_URL = "https://toy.pequla.com/api/toy"

def normalize(s: Any) -> str:
    return str(s or "").strip().lower()

def fetch_toys() -> List[Dict[str, Any]]:
    rsp = requests.get(API_URL, timeout=15)
    rsp.raise_for_status()
    return rsp.json()

def score_match(toy: Dict[str, Any], query: str) -> int:
    q = normalize(query)

    name = normalize(toy.get("name"))
    perm = normalize(toy.get("permalink"))
    desc = normalize(toy.get("description"))
    type_name = normalize((toy.get("type") or {}).get("name"))

    score = 0

    # split query u reci
    words = q.split()

    # JAK MATCH – sve reci postoje u imenu
    if all(w in name for w in words):
        score += 120

    # DELIMICNI MATCH – bar jedna rec
    for w in words:
        if w in name:
            score += 40
        if w in perm:
            score += 25
        if w in desc:
            score += 10
        if w in type_name:
            score += 35

    return score


def find_best_toy(toys: List[Dict[str, Any]], query: str) -> Optional[Dict[str, Any]]:
    if not query:
        return None
    ranked = sorted(((score_match(t, query), t) for t in toys), key=lambda x: x[0], reverse=True)
    if not ranked or ranked[0][0] <= 0:
        return None
    return ranked[0][1]

def filter_toys(
    toys: List[Dict[str, Any]],
    uzrast: Optional[str] = None,
    tip: Optional[str] = None,
    target: Optional[str] = None,
    min_cena: Optional[float] = None,
    max_cena: Optional[float] = None,
) -> List[Dict[str, Any]]:
    u = normalize(uzrast) if uzrast else None
    t = normalize(tip) if tip else None
    g = normalize(target) if target else None

    out = []
    for toy in toys:
        # uzrast
        if u:
            age = normalize((toy.get("ageGroup") or {}).get("name"))
            if age != u:
                continue

        # tip (contains)
        if t:
            type_name = normalize((toy.get("type") or {}).get("name"))
            if t not in type_name:
                continue

        # target group: ako user traži dečak/devojčica, prihvati i "svi"
        if g:
            tg = normalize(toy.get("targetGroup"))
            if tg not in [g, "svi"]:
                continue

        # cena
        price = float(toy.get("price") or 0)
        if min_cena is not None and price < float(min_cena):
            continue
        if max_cena is not None and price > float(max_cena):
            continue

        out.append(toy)

    return out

def summarize_toy(toy: Dict[str, Any]) -> str:
    name = toy.get("name")
    price = toy.get("price")
    age = (toy.get("ageGroup") or {}).get("name")
    t = (toy.get("type") or {}).get("name")
    tg = toy.get("targetGroup")
    return f"🧸 {name}\n💰 Cena: {price} RSD\n👶 Uzrast: {age}\n🏷️ Tip: {t}\n🎯 Za: {tg}"

def rank_for_recommendation(toys: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # najjednostavnije: najjeftinije prvo
    return sorted(toys, key=lambda x: float(x.get("price") or 0))


class ActionPrikaziSveIgracke(Action):
    def name(self) -> Text:
        return "action_prikazi_sve_igracke"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        toys = fetch_toys()
        dispatcher.utter_message(text=f"Pronašao sam {len(toys)} igračaka. Evo liste:")
        dispatcher.utter_message(attachment=toys)

        # set last_toy kao prvu (da pitanja tipa 'koliko košta?' rade odmah)
        if toys:
            return [SlotSet("last_toy", toys[0])]
        return []


class ActionTraziIgracku(Action):
    def name(self) -> Text:
        return "action_trazi_igracku"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        query = next(tracker.get_latest_entity_values("naziv_igracke"), None)
        if not query:
            query = tracker.latest_message.get("text", "")

        toys = fetch_toys()
        toy = find_best_toy(toys, query)

        if not toy:
            dispatcher.utter_message(text=f"Nisam našao igračku za: '{query}'. Probaj drugi naziv ili reci „prikaži sve igračke“.")
            return []

        dispatcher.utter_message(text=f"Našao sam igračku:\n{summarize_toy(toy)}\n\nAko želiš, reci: „reci mi opis“ ili „koliko košta?“")
        dispatcher.utter_message(attachment=[toy])
        return [SlotSet("last_toy", toy)]


class ActionFiltrirajPoUzrastu(Action):
    def name(self) -> Text:
        return "action_filtriraj_po_uzrastu"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        uzrast = tracker.get_slot("uzrast") or next(tracker.get_latest_entity_values("uzrast"), None)
        if not uzrast:
            dispatcher.utter_message(response="utter_pitaj_uzrast")
            return []

        toys = fetch_toys()
        filtered = filter_toys(toys, uzrast=uzrast)

        if not filtered:
            dispatcher.utter_message(text=f"Nema igračaka za uzrast {uzrast}.")
            return []

        dispatcher.utter_message(text=f"Za uzrast {uzrast} imam {len(filtered)} igračaka:")
        dispatcher.utter_message(attachment=filtered)
        return [SlotSet("last_toy", filtered[0])]


class ActionFiltrirajPoTipu(Action):
    def name(self) -> Text:
        return "action_filtriraj_po_tipu"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        tip = tracker.get_slot("tip") or next(tracker.get_latest_entity_values("tip"), None)
        if not tip:
            dispatcher.utter_message(response="utter_pitaj_tip")
            return []

        toys = fetch_toys()
        filtered = filter_toys(toys, tip=tip)

        if not filtered:
            dispatcher.utter_message(text=f"Nisam našao igračke tipa '{tip}'.")
            return []

        dispatcher.utter_message(text=f"Pronašao sam {len(filtered)} igračaka za tip '{tip}':")
        dispatcher.utter_message(attachment=filtered)
        return [SlotSet("last_toy", filtered[0])]


class ActionFiltrirajPoTargetu(Action):
    def name(self) -> Text:
        return "action_filtriraj_po_targetu"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        target = tracker.get_slot("target") or next(tracker.get_latest_entity_values("target"), None)
        if not target:
            dispatcher.utter_message(response="utter_pitaj_target")
            return []

        toys = fetch_toys()
        filtered = filter_toys(toys, target=target)

        if not filtered:
            dispatcher.utter_message(text=f"Nisam našao igračke za '{target}'.")
            return []

        dispatcher.utter_message(text=f"Za '{target}' imam {len(filtered)} igračaka (uključujući i 'svi'):")
        dispatcher.utter_message(attachment=filtered)
        return [SlotSet("last_toy", filtered[0])]


class ActionFiltrirajPoCeni(Action):
    def name(self) -> Text:
        return "action_filtriraj_po_ceni"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        max_cena = tracker.get_slot("max_cena")
        min_cena = tracker.get_slot("min_cena")

        # fallback: pokušaj iz teksta izvući brojeve ako entity nije uhvaćen
        text = normalize(tracker.latest_message.get("text", ""))
        if max_cena is None and any(ch.isdigit() for ch in text):
            nums = [int("".join([c for c in w if c.isdigit()])) for w in text.replace(".", " ").split() if any(c.isdigit() for c in w)]
            if len(nums) == 1:
                max_cena = float(nums[0])
            elif len(nums) >= 2:
                min_cena = float(nums[0])
                max_cena = float(nums[1])

        if max_cena is None and min_cena is None:
            dispatcher.utter_message(response="utter_pitaj_budzet")
            return []

        toys = fetch_toys()
        filtered = filter_toys(toys, min_cena=min_cena, max_cena=max_cena)

        if not filtered:
            dispatcher.utter_message(text="Nisam našao igračke u tom cenovnom rangu.")
            return []

        if min_cena is not None and max_cena is not None:
            dispatcher.utter_message(text=f"Igračke od {int(min_cena)} do {int(max_cena)} RSD: ({len(filtered)})")
        elif max_cena is not None:
            dispatcher.utter_message(text=f"Igračke do {int(max_cena)} RSD: ({len(filtered)})")
        else:
            dispatcher.utter_message(text=f"Igračke od {int(min_cena)} RSD naviše: ({len(filtered)})")

        dispatcher.utter_message(attachment=filtered)
        return [SlotSet("last_toy", filtered[0])]


class ActionPreporuciIgracku(Action):
    def name(self) -> Text:
        return "action_preporuci_igracku"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]):
        uzrast = tracker.get_slot("uzrast")
        tip = tracker.get_slot("tip")
        target = tracker.get_slot("target")
        max_cena = tracker.get_slot("max_cena")
        min_cena = tracker.get_slot("min_cena")

        # ako nema dovoljno info → pitaj
        if not uzrast:
            dispatcher.utter_message(response="utter_pitaj_uzrast")
            return []
        if not tip:
            dispatcher.utter_message(response="utter_pitaj_tip")
            return []
        if max_cena is None:
            dispatcher.utter_message(response="utter_pitaj_budzet")
            return []
        if not target:
            dispatcher.utter_message(response="utter_pitaj_target")
            return []

        toys = fetch_toys()
        filtered = filter_toys(
            toys,
            uzrast=uzrast,
            tip=tip,
            target=target,
            min_cena=min_cena,
            max_cena=max_cena,
        )

        if not filtered:
            dispatcher.utter_message(
                text="Nemam baš tačno to po kriterijumima. Hoćeš da probamo bez tipa ili sa većim budžetom?"
            )
            return []

        ranked = rank_for_recommendation(filtered)
        top = ranked[:5]

        dispatcher.utter_message(
            text=f"Na osnovu: uzrast {uzrast}, tip '{tip}', za '{target}', budžet do {int(max_cena)} RSD — predlažem ove:"
        )
        dispatcher.utter_message(attachment=top)
        dispatcher.utter_message(text="Ako želiš, reci: „reci mi opis“ ili „koliko košta?“ za poslednju predloženu igračku.")
        return [SlotSet("last_toy", top[0])]


# ----- Last toy Q&A -----

def get_last_toy(tracker: Tracker) -> Optional[Dict[str, Any]]:
    toy = tracker.get_slot("last_toy")
    return toy if isinstance(toy, dict) else None

class ActionLastToyCena(Action):
    def name(self) -> Text:
        return "action_last_toy_cena"

    def run(self, dispatcher, tracker, domain):
        toy = get_last_toy(tracker)
        if not toy:
            dispatcher.utter_message(text="Prvo mi reci koju igračku gledaš (npr. „traži igračku panda“).")
            return []
        dispatcher.utter_message(text=f"Cena za '{toy.get('name')}' je {toy.get('price')} RSD.")
        return []

class ActionLastToyOpis(Action):
    def name(self) -> Text:
        return "action_last_toy_opis"

    def run(self, dispatcher, tracker, domain):
        toy = get_last_toy(tracker)
        if not toy:
            dispatcher.utter_message(text="Prvo mi reci koju igračku gledaš (npr. „traži igračku panda“).")
            return []
        dispatcher.utter_message(text=f"Opis za '{toy.get('name')}': {toy.get('description')}")
        return []

class ActionLastToyUzrast(Action):
    def name(self) -> Text:
        return "action_last_toy_uzrast"

    def run(self, dispatcher, tracker, domain):
        toy = get_last_toy(tracker)
        if not toy:
            dispatcher.utter_message(text="Prvo mi reci koju igračku gledaš (npr. „traži igračku panda“).")
            return []
        age = (toy.get("ageGroup") or {}).get("name")
        dispatcher.utter_message(text=f"Uzrast za '{toy.get('name')}' je: {age}.")
        return []

class ActionLastToyTip(Action):
    def name(self) -> Text:
        return "action_last_toy_tip"

    def run(self, dispatcher, tracker, domain):
        toy = get_last_toy(tracker)
        if not toy:
            dispatcher.utter_message(text="Prvo mi reci koju igračku gledaš (npr. „traži igračku panda“).")
            return []
        t = (toy.get("type") or {}).get("name")
        dispatcher.utter_message(text=f"Tip za '{toy.get('name')}' je: {t}.")
        return []

class ActionLastToyTarget(Action):
    def name(self) -> Text:
        return "action_last_toy_target"

    def run(self, dispatcher, tracker, domain):
        toy = get_last_toy(tracker)
        if not toy:
            dispatcher.utter_message(text="Prvo mi reci koju igračku gledaš (npr. „traži igračku panda“).")
            return []
        dispatcher.utter_message(text=f"Ciljna grupa za '{toy.get('name')}' je: {toy.get('targetGroup')}.")
        return []
