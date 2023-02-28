import * as JsonServerAPI from "../../common/services/api/jsonServerAPI";
import * as FakeAPI from "../../common/services/api/fakeAPI";
import { getRandomName, getRandomText, rnd } from "../../common/tools";

const useFake = false;

export const api = useFake ? FakeAPI : JsonServerAPI;

const addMessageToFloodZone = () => {
    setTimeout(() => {
        api.addMessage("floodZone", getRandomText(), getRandomName());
        addMessageToFloodZone();
    }, rnd(2000));
};

addMessageToFloodZone();

const addMessageToAnotherOne = () => {
    setTimeout(() => {
        api.addMessage("anotherOne", getRandomText(), getRandomName());
        addMessageToAnotherOne();
    }, rnd(5000));
};

addMessageToAnotherOne();