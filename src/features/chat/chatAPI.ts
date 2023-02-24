import { Message } from "./models/message";
//import messages from "./messages.json";

export const fetchMessages = async (chatId: string, skip: number)
    : Promise<{ messages: Message[], size: number }> => {
    const response = await fetch(`/chatData/${chatId}/messages.json`, {
        headers: {
            range: `${skip}-`
        }
    });

    let blob = await response.blob();

    const size = blob.size;

    if (!size) {
        return {
            messages: [],
            size: 0,
        };
    }

    const rawText = await blob.text();

    console.log({ size });

    console.log(rawText);

    const messages = JSON.parse(rawText + "]") as Message[];

    return {
        messages,
        size
    };
}

const fakeChatMessages: Message[] = [];

const delayedResolve = <T>(value: T): Promise<T> =>
    new Promise(resolve => setTimeout(() => resolve(value), Math.random() * 1000));

type Results<T> = {
    data: T[],
    isLast: boolean,
    isFirst: boolean,
}

export const fake = {
    getMessages: (chatId: string, limit = 20, offsetId?: number): Promise<Results<Message>> => {
        const rangeEnd = Math.min(offsetId || Infinity, fakeChatMessages.length);
        const rangeStart = Math.max(rangeEnd - limit, 0);

        const results = fakeChatMessages.slice(rangeStart, rangeEnd);
        const isFirst = rangeStart === 0;
        const isLast = rangeEnd === fakeChatMessages.length;

        return delayedResolve({
            data: results,
            isFirst,
            isLast,
        });
    },
}

const addMessage = () => {
    setTimeout(() => {
        fakeChatMessages.push(generateMockMessage());
        addMessage();
    }, Math.random() * 2000);
};

addMessage();

const rnd = (limit: number) => Math.floor(Math.random() * limit);

const getRandomElement = <T>(array: T[]) => array[rnd(array.length)];

const generateMockMessage = (): Message => {
    const subject = ['Илон Маск', 'Программист 1С', 'Джон Кармак', 'Джо Армстронг', 'Dan Abramov', 'DHH', 'Matz', 'Линус Торвальдс', 'Дуров', 'Упрямый рубист', 'Системщик-байтофил', 'Обезумевший индус', '13-летний сеньор'];
    const action = ['удалил', 'реализовал', 'забыл', 'написал', 'уничтожил', 'придумал', 'протестировал', 'выпустил', 'выложил в опенсорс', 'подал в суд на', 'съел', 'предал анафеме', 'запустил', 'благословил', 'купил себе', 'поджёг', 'записал песню про', 'добавил лишний байт в', 'записал на перфокарты', 'дизассемблировал', 'скомпилировал', 'установил', 'не смог установить', 'выучил наизусть', 'не понял', 'забил на', 'распечатал', 'проиграл в карты', 'снял видеоурок про', 'влюбился в', 'взломал', 'украл', 'запустил в космос'];
    const object = ['Redux-toolkit', 'исходники Linux', 'тесты', 'жену', 'leftpad', 'Ruby', 'логическую бомбу', 'Pokémon Go', 'Redis-кластер', 'Javascript', 'твиттер', 'Erlang', 'стандартную библиотеку Java', 'Emacs', 'Vim', 'тетрис', '1C', 'ассемблер', 'ядро Basic', 'Google', 'Redux', 'Postgres', 'Haskell', 'разницу между CI и CD', 'строковый тип', 'Telegram-бота', 'ActiveRecord', 'Python', 'Delphi', 'Node.js', 'Go', 'PHP', 'очередную реализацию очередей', 'Bitcoin', 'искусственный интеллект', 'пакет пакетных менеджеров', 'абстрактную фабрику', 'пару хипстеров', 'весь украинский аутсорс'];
    const adverbial1 = [' на почве', ' из-за', ' в бытовом споре по поводу', ' в борьбе за независимость', ' в результате воздействия', ' под действием', ' в состоянии', ' под видом', ' в процессе разработки', ' на виду у любителей', ' из-за недостатка', ' от переизбытка', ' в отместку за запрет', ' в процессе тестирования', ', протестуя против', ', устав от', ', опасаясь', ', доказывая вред', ' при поддержке', ' с помощью', ' в качестве доказательства существования', ' в честь дня'];
    const adverbialObject = ['многопоточности', 'Битрикса', 'парного программирования', 'интернетов', 'распределенных вычислений', 'метапрограммирования', 'жидкой методологии', 'наркотиков', 'нового препроцессора JS', 'инопланетных излучений', 'конкурентности', 'ЦРУ', 'выгорания', 'NoSQL', 'гитхаба', 'пузырьковой сортировки', 'покемонов', 'соцсетей', 'автокомплита', 'денег', 'идемпотентности', 'приведения типов', 'образования', 'троичной логики', 'плавающей запятой', 'сильного рубля', 'битовых сдвигов', 'кодировки CP-1251', 'IDE', 'технического долга', 'дедлоков', 'модных микросервисов', 'толерантности', 'телепортации', 'русского SQL', 'TDD', 'онлайн-игр', 'математики', 'онанизма', 'операционной системы Linux', 'процессорного времени', 'зависимостей', 'естественного отбора', 'npm install', 'опенсорса', 'функционального программирования', 'хакеров', 'падающих тестов'];

    const time = new Date();
    time.setMinutes(time.getMinutes() - rnd(19) - 1);
    return {
        name: subject[rnd(subject.length)],
        text: [subject, action, object, adverbial1, adverbialObject].map(getRandomElement).join(" "),
        date: (time.toISOString().match(/T([\d:]+)\./)!)[1],
        id: fakeChatMessages.length,
    };
};