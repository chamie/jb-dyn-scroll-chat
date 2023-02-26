import * as JsonServerAPI from "../../common/services/api/jsonServerAPI";
import * as FakeAPI from "../../common/services/api/fakeAPI";
import { getRandomName, getRandomText, rnd } from "../../common/tools";

const useFake = false;

export const api = useFake ? FakeAPI : JsonServerAPI;

const addMessage = () => {
    setTimeout(() => {
        api.addMessage("floodZone", getRandomText(), getRandomName());
        addMessage();
    }, rnd(2000));
};

addMessage();