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
    new Promise(resolve => setTimeout(() => resolve(value), Math.random() * 100));


export const fake = {
    getMessages: (chatId: string, limit = 20, offsetId?: number): Promise<Message[]> => {
        const results = (offsetId === undefined)
            ? fakeChatMessages.slice(-limit)
            : fakeChatMessages.slice(offsetId - limit, offsetId);

        //console.log(`Top ${top} messages requested from chat ${chatId}, starting from message ${skip}`);

        return delayedResolve<Message[]>(results);
    },
}

const addMessage = () => {
    setTimeout(() => {
        fakeChatMessages.push(generateMockMessage());
        addMessage();
    }, Math.random() * 1000);
};

addMessage();

const generateMockMessage = (): Message => {
    const arr1 = ['Илон Маск', 'Программист 1С', 'Джон Кармак', 'Джо Армстронг', 'Dan Abramov', 'DHH', 'Matz', 'Линус Торвальдс', 'Дуров', 'Упрямый рубист', 'Системщик-байтофил', 'Обезумевший индус', 'Илюша', '13-летний сеньор'];
    const arr2 = ['удалил', 'реализовал', 'забыл', 'написал', 'уничтожил', 'придумал', 'протестировал', 'выпустил', 'выложил в опенсорс', 'подал в суд на', 'съел', 'предал анафеме', 'запустил', 'благословил', 'купил себе', 'поджёг', 'записал песню про', 'добавил лишний байт в', 'записал на перфокарты', 'дизассемблировал', 'скомпилировал', 'установил', 'не смог установить', 'выучил наизусть', 'не понял', 'забил на', 'распечатал', 'проиграл в карты', 'снял видеоурок про', 'влюбился в', 'взломал', 'украл', 'запустил в космос'];
    const arr3 = ['исходники Linux', 'тесты', 'жену', 'leftpad', 'Ruby', 'логическую бомбу', 'Pokémon Go', 'Redis-кластер', 'Javascript', 'твиттер', 'Erlang', 'стандартную библиотеку Java', 'Emacs', 'Vim', 'тетрис', '1C', 'ассемблер', 'ядро Basic', 'Google', 'Redux', 'Postgres', 'Haskell', 'разницу между CI и CD', 'строковый тип', 'Telegram-бота', 'ActiveRecord', 'Python', 'Delphi', 'Node.js', 'Go', 'PHP', 'очередную реализацию очередей', 'Bitcoin', 'искусственный интеллект', 'пакет пакетных менеджеров', 'абстрактную фабрику', 'пару хипстеров', 'весь украинский аутсорс'];
    const arr4 = [' на почве', ' из-за', ' в бытовом споре по поводу', ' в борьбе за независимость', ' в результате воздействия', ' под действием', ' в состоянии', ' под видом', ' в процессе разработки', ' на виду у любителей', ' из-за недостатка', ' от переизбытка', ' в отместку за запрет', ' в процессе тестирования', ', протестуя против', ', устав от', ', опасаясь', ', доказывая вред', ' при поддержке', ' с помощью', ' в качестве доказательства существования', ' в честь дня'];
    const arr5 = ['многопоточности', 'Битрикса', 'парного программирования', 'интернетов', 'распределенных вычислений', 'метапрограммирования', 'жидкой методологии', 'наркотиков', 'нового препроцессора JS', 'инопланетных излучений', 'конкурентности', 'ЦРУ', 'выгорания', 'NoSQL', 'гитхаба', 'пузырьковой сортировки', 'покемонов', 'соцсетей', 'автокомплита', 'денег', 'идемпотентности', 'приведения типов', 'образования', 'троичной логики', 'плавающей запятой', 'сильного рубля', 'битовых сдвигов', 'кодировки CP-1251', 'IDE', 'технического долга', 'дедлоков', 'модных микросервисов', 'толерантности', 'телепортации', 'русского SQL', 'TDD', 'онлайн-игр', 'математики', 'онанизма', 'операционной системы Linux', 'процессорного времени', 'зависимостей', 'естественного отбора', 'npm install', 'опенсорса', 'функционального программирования', 'хакеров', 'падающих тестов'];

    const rnd = (limit: number) => {
        return Math.floor(Math.random() * limit);
    }
    const time = new Date();
    time.setMinutes(time.getMinutes() - rnd(19) - 1);
    return {
        name: arr1[rnd(arr1.length)],
        text: arr1[rnd(arr1.length)] + ' ' + arr2[rnd(arr2.length)] + ' ' + arr3[rnd(arr3.length)] + arr4[rnd(arr4.length)] + ' ' + arr5[rnd(arr5.length)],
        date: time.getHours() + ":" + time.getMinutes(),
        id: fakeChatMessages.length,
    };
};