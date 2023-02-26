import * as JsonServer from 'json-server';
import { Results } from '../src/common/types/results';
import * as open from 'open';

type Message = {
    name: string,
    text: string,
    date: string,
    id: number,
    chatId: string,
}

const data = {
    messages: [] as Message[],
    chats: [{ id: "floodZone" }, { id: "anotherOne" }]
}

const server = JsonServer.create();
const router = JsonServer.router(data);
const middlewares = JsonServer.defaults({
    static: "./build",
});



server.use(middlewares);
server.use(router);
server.listen(3001, () => {
    console.log('JSON Server is running')
});


(router as any).render = (req, res) => {
    const { chatId } = req.query;
    const totalCount = res.getHeader("X-Total-Count");
    if (req.url === "/messages" && totalCount && chatId) {
        const messagesBeforGivenId = parseInt(totalCount);
        const resultCount = res.locals.data.length;
        const totalMessageCount = data.messages.filter(x => x.chatId === chatId).length;
        const isFirst = messagesBeforGivenId === resultCount;
        const isLast = messagesBeforGivenId === totalMessageCount;

        const results: Results<Message> = {
            data: res.locals.data.sort(((x, y) => x.id - y.id)),
            isFirst,
            isLast,
        }
        res.jsonp(results);
    } else {
        res.jsonp(res.locals.data);
    }
}
const shouldLaunchBrowser = process.argv[2] === "launch-browser";

if (shouldLaunchBrowser) {
    open("http://localhost:3001");
}