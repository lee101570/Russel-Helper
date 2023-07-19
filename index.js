
const fetch = require('node-fetch');
const fs = require('fs')
const express = require('express');
var date = new Date();
require("dotenv").config();

console.log()


function sendAlertToTelegramRoom(message) {
    var telegramUrl = `https://api.telegram.org/bot${process.env.TelegramBotToken}/sendMessage?chat_id=-960467766&text=${message}`
    fetch(telegramUrl)
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error(error));
}


// read local json file using fs and save to variable
var scheduleRawData = fs.readFileSync('data/schedule.json', 'utf8');
// var scheduleData = {}
var scheduleData = JSON.parse(scheduleRawData);
var todoRawData = fs.readFileSync('data/todo.json', 'utf8');
var todoData = JSON.parse(todoRawData);

// 데이터 변수
var classTimeTable = {
    "0교시": [700, 750],
    "1교시": [800, 840],
    "2교시": [850, 1010],
    "3교시": [1030, 1210],
    "점심시간": [1210, 1310],
    "4교시": [1310, 1420],
    "5교시": [1440, 1600],
    "6교시": [1620, 1730],
    "저녁시간": [1730, 1830],
    "7교시": [1830, 2000],
    "8교시": [2020, 2150],
}


// 저장 함수
async function save() {
    fs.writeFileSync('data/schedule.json', JSON.stringify(scheduleData));
    fs.writeFileSync('data/todo.json', JSON.stringify(todoData));
}

// 한자리 숫자면, 앞에 0을 붙이는 함수
async function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}









//스케쥴 코드로, 스케쥴 시간을 받아오는 함수
function scheduleCodeToTime(code) {
    //만약 'scheduleData['scheduleInfo'][code]'가 존재하지 않는다면, '존재하지 않는 스케쥴'을 반환
    if (scheduleData['scheduleInfo'][code] == undefined) {
        return '존재하지 않는 스케쥴';
    } else {
        //존재한다면, 'scheduleData['scheduleInfo'][code][time]'이 3.5인지, 7인지 체크하여 각각 데이터를 반환
        if (scheduleData['scheduleInfo'][code]['time'] == 3.5) {
            return '3.5시간 스케쥴';
        }
        if (scheduleData['scheduleInfo'][code]['time'] == 7) {
            return '7시간 스케쥴';
        }
    }
}


//특정 요일의 스케쥴이 있는지 확인하는 함수
async function checkSchedule(day) {
    // console.log(Object.keys(scheduleData['scheduleInfo']).length)
    for (var i = 0; i < Object.keys(scheduleData['scheduleInfo']).length; i++) {
        for (var j = 0; j < Object.keys(scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData']).length; j++) {
            // console.log(scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData'][j][0].split('-')[0])
            if (scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData'][j][0].split('-')[0] == day) {
                return true;
            }
        }

    }
    return false;
}

//현재 시간과 교시를 변환하는 함수
async function nowTimeToClassTime() {
    var date = new Date();
    var nowTime = date.getHours();
    var nowMinute = date.getMinutes();
    // var nowTimeCode = Number(String(nowTime) + await addZero(nowMinute))
    var nowTimeCode = 600

    console.log(nowTimeCode)
    for (var i = 0; i < Object.keys(classTimeTable).length; i++) {
        if (nowTimeCode >= classTimeTable[Object.keys(classTimeTable)[i]][0] && nowTimeCode <= classTimeTable[Object.keys(classTimeTable)[i]][1]) {
            return Object.keys(classTimeTable)[i]
        }

        if (i == Object.keys(classTimeTable).length - 1) {
            if (nowTimeCode >= classTimeTable[Object.keys(classTimeTable)[i]][1]) {
                return '하원 후'
            }
            if (nowTimeCode <= classTimeTable[Object.keys(classTimeTable)[0]][0]) {
                return '등원 전'
            }
            // if(nowTimeCode>=classTimeTable[Object.keys(classTimeTable)[0]][0] && nowTimeCode<=classTimeTable[Object.keys(classTimeTable)[0]][1]){
            //     return '0교시 전'
            // }
        }
        //위 조건에 모두 맞지 않고, 각 교시의 시작시간과 끝시간 사이에 있을 경우, 해당 교시의 쉬는시간임을 반환
        if (nowTimeCode >= classTimeTable[Object.keys(classTimeTable)[i]][1] && nowTimeCode <= classTimeTable[Object.keys(classTimeTable)[i + 1]][0]) {
            return Object.keys(classTimeTable)[i] + ' 쉬는시간'
        }

    }

}

//특정 요일의 스케쥴까지 얼마나 남았는지 확인하는 함수
var checkScheduleRemainTimeVar = ""
async function checkScheduleRemainTimeGet(day) {
    var todaySchedule = []
    if (await checkSchedule(day)) {
        checkScheduleRemainTimeVar = ""
        for (var i = 0; i < Object.keys(scheduleData['scheduleInfo']).length; i++) {
            for (var j = 0; j < Object.keys(scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData']).length; j++) {
                if (scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData'][j][0].split('-')[0] == day) {
                    todaySchedule.push(Number(scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData'][j][0].split('-')[1]))
                }
            }

        }
        checkScheduleRemainTimeVar = "단과수업: " + todaySchedule.length + "개" + "\n\n"
        await nowTimeToClassTime().then((nowTimeToClassTime) => {
            console.log('현재교시: ' + nowTimeToClassTime)
            if (nowTimeToClassTime.includes('교시')) {
                var nowClassTimeNumber = nowTimeToClassTime.split('교시')[0]
                //만약 todaySchedule에 nowClassTimeNumber보다 큰 값이 있다면, 그 값이 다음 수업임
                //그런데, 큰 값이 없다면, 모든 수업이 끝난 것이므로, 다음 수업은 없음
                for (var i = 0; i < todaySchedule.length; i++) {
                    if (todaySchedule[i] > nowClassTimeNumber) {
                        checkScheduleRemainTimeVar += "다음 수업🏫: " + todaySchedule[i] + "교시"
                        break;
                    }
                    //그런데, 큰 값이 없다면, 모든 수업이 끝난 것이므로, 다음 수업은 없음
                    if (i == todaySchedule.length - 1) {
                        checkScheduleRemainTimeVar += "다음 수업🏫: 없음"
                        break;
                    }
                }
                // 해당 부분은 필요없을듯..? 혹시 모르니 남겨둠
                // if (todaySchedule[todaySchedule.length - 1] < nowClassTimeNumber) {
                //     checkScheduleRemainTimeVar += "다음 수업🏫: 없음"
                // }
            }
            // console.log(checkScheduleRemainTimeVar)
            return checkScheduleRemainTimeVar;
        })
    } else {
        checkScheduleRemainTimeVar = "단과수업: 없음"
        return "단과수업: 없음"
    }
}

async function checkScheduleRemainTime(day) {
    await checkScheduleRemainTimeGet(day)
    return checkScheduleRemainTimeVar
}







//현재 상태를 불러오는 함수
async function nowUserStatus() {
    var userStatusText = ""
    /*
    1. 자습중
    2. 수업중 ok
    3. 점심시간
    4. 쉬는시간
    5. 등교 전
    6. 하원 후
    */
    await nowTimeToClassTime().then((nowTimeToClassTime) => {
        var date = new Date();
        var nowTime = date.getHours();
        var nowMinute = date.getMinutes();
        var dayOfWeek = date.getDay();
        var nowTimeCode = Number(String(nowTime) + String(nowMinute))
        if (nowTimeToClassTime.includes('교시')) {
            //쉬는시간 판별
            var isBreakTime = nowTimeToClassTime.split('교시')[1] == ' 쉬는시간'
            if (isBreakTime) {
                userStatusText = '잠시 쉬는중😌'
            }

            //자습시간 판별
            if (!isBreakTime) {
                userStatusText = '자습중🖊️'
            }

            // 수업중 판별
            var nowClassTimeNumber = nowTimeToClassTime.split('교시')[0]
            for (var i = 0; i < Object.keys(scheduleData['scheduleInfo']).length; i++) {
                for (var j = 0; j < Object.keys(scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData']).length; j++) {
                    if (scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData'][j][0].split('-')[0] == dayOfWeek) {
                        for (var k = 0; k < Object.keys(scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData'][j]).length; k++) {
                            if (Number(scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData'][j][k].split('-')[1]) == nowClassTimeNumber) {
                                userStatusText = "수업중🔥"
                                console.log("수업중🔥")
                            }
                        }
                    }
                }
            }
        }
        if (nowTimeToClassTime == '하원 후' || nowTimeToClassTime == '등원 전') {
            userStatusText = '깊게 쉬는중😴'
        }
    })
    return userStatusText;
}



//만약, 지금이 수업중이라면, 수업 정보를 출력하는 함수
var nowClassInfoText = ""
async function nowClassInfoGet() {
    var userStatusData = await nowUserStatus()
    await nowTimeToClassTime().then((nowTimeToClassTime) => {
        var date = new Date();
        var dayOfWeek = date.getDay();

        if (userStatusData == '수업중🔥') {
            var nowClassTimeNumber = nowTimeToClassTime.split('교시')[0]
            for (var i = 0; i < Object.keys(scheduleData['scheduleInfo']).length; i++) {
                for (var j = 0; j < Object.keys(scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData']).length; j++) {
                    if (scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData'][j][0].split('-')[0] == dayOfWeek) {
                        for (var k = 0; k < Object.keys(scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData'][j]).length; k++) {
                            if (Number(scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['timeData'][j][k].split('-')[1]) == nowClassTimeNumber) {
                                //console.log에서는 resultData를 리턴하지만, return에서는 resultData를 리턴하지 않음. 문제 해결하기.                        
                                nowClassInfoText = scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['teacher'] + ' - ' + scheduleData['scheduleInfo'][Object.keys(scheduleData['scheduleInfo'])[i]]['subject']
                            }
                        }
                    }
                }
            }
        } else {
            nowClassInfoText = "수업중이 아닙니다."
        }
    })
}

async function nowClassInfo() {
    await nowClassInfoGet()
    return nowClassInfoText
}



//스케쥴을 등록하는 함수
async function registerSchedule(code, time, teacher, subject, room, timeData) {

    // 만약 'scheduleData['scheduleInfo'][code]'가 존재한다면, '이미 존재하는 스케쥴'을 반환
    try {
        if (scheduleData['scheduleInfo'][code] != undefined) {
            return '이미 존재하는 스케쥴';
        } else {
            //존재하지 않는다면, 신규 데이터 등록
            //만약 timeData에 /가 있다면, "timeData" 내에, 0, 1로 등록해야함
            var timeData0;
            if (timeData.includes('/')) {
                var timeData1 = timeData.split('/')[0];
                var timeData2 = timeData.split('/')[1];
                timeData0 = { "0": timeData1, "1": timeData2 };
            } else {
                timeData0 = { "0": timeData };
            }
            scheduleData['scheduleInfo'][code] = {
                'time': String(time),
                'teacher': teacher,
                'subject': subject,
                'room': room,
                'timeData': timeData0
            }
            console.log(scheduleData);
            await save()
        }
    } catch (err) {
        scheduleData['scheduleInfo'][code] = {}
        registerSchedule(code, time, teacher, subject, room, timeData)
    }
}


// 텔레그램 봇 부분
// 필요한 모듈을 가져옴
const TelegramBot = require('node-telegram-bot-api');



// 텔레그램 봇 객체 생성
const bot = new TelegramBot(process.env.TelegramBotToken, { polling: true });

//설정용 유저 변수 모음
var userSetting = {}

bot.onText(/\/dev/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, await nowClassInfo())
})


bot.onText(/\/menu/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    //if userId not in userSetting, add userId to userSetting
    if (userSetting[userId] == undefined) {
        userSetting[userId] = {}
    }
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '메인 메뉴', callback_data: 'main_menu' }],
                [{ text: '설정', callback_data: 'settings' }],
            ]
        }
    };
    bot.sendMessage(chatId, '메뉴를 선택해주세요.', options);
});


bot.onText(/\/settings/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    //if userId not in userSetting, add userId to userSetting
    if (userSetting[userId] == undefined) {
        userSetting[userId] = {}
    }
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '수업 관리', callback_data: 'manage_class' }],
            ]
        }
    };
    bot.sendMessage(chatId, '메뉴를 선택해주세요.', options);
});

bot.on('callback_query', async (query) => {
    try {
        console.log(query)
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        const data = query.data;
        const userId = query.from.id;
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var dayOfWeek = date.getDay();
        var dayOfWeekKorean = ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek];

        // 메인 메뉴
        if (data == 'main_menu') {
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '내 학습정보 확인', callback_data: 'my_study_info' }],
                        [{ text: '설정', callback_data: 'settings' }],
                    ]
                }
            };
            bot.editMessageText('메뉴를 선택해주세요.', {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: options.reply_markup
            });
        }


        if (data == 'settings') {
            if (userSetting[userId] == undefined) {
                userSetting[userId] = {}
            }
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '수업 관리', callback_data: 'manage_class' }],
                    ]
                }
            };
            bot.sendMessage(chatId, '설정입니다.', options);
        }

        // 스케쥴 확인 부분
        // if (data == 'check_schedule') {
        //     /*
        //     [2023년 7월 19일 수요일 스케쥴]

        //     단과수업: n개

        //     자습 종료까지 남은 시간: n시간 n분
        //     단과까지 남은 시간: n시간 n분
        //     */

        //     var scheduleText = `[${year}년 ${month}월 ${day}일 ${dayOfWeekKorean}요일 스케쥴]\n\n`
        //     // if()
        //     bot.sendMessage(chatId, scheduleText);
        // }


        //내 정보 확인 부분
        if (data == 'my_study_info') {
            var myStudyInfoText = `[${year}년 ${month}월 ${day}일 ${dayOfWeekKorean}요일] 내 학습정보\n\n`
            if (await nowClassInfo() == '수업중이 아닙니다.') {
                myStudyInfoText += '내 상태: ' + await nowUserStatus() + '(' + await nowTimeToClassTime() + ')'
            } else {
                myStudyInfoText += '내 상태: ' + await nowUserStatus() + '(' + await nowClassInfo() + ')'
            }

            myStudyInfoText += '\n' + await checkScheduleRemainTime(dayOfWeek)
            bot.editMessageText(myStudyInfoText, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '메인 메뉴', callback_data: 'main_menu' }],
                    ]
                },
            });
        }

        // 수업 관리 부분
        if (data == 'manage_class') {
            var message = '수업 관리 메뉴입니다.'
            bot.editMessageText(message, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '수업 추가', callback_data: 'add_class' }],
                        [{ text: '수업 수정', callback_data: 'edit_class' }],
                    ]
                },
            });
        }
        // 수업 추가 부분
        // 수업코드 -> 강사명 -> 수업시수 -> 과목명 -> 강의실 -> 수업교시
        if (data == 'add_class') {
            const namePrompt1 = await bot.sendMessage(query.message.chat.id, "수업 추가 메뉴입니다.\n\n수업코드를 보내주세요.\n(1/6)", {
                reply_markup: {
                    force_reply: true,
                },
            });
            bot.onReplyToMessage(query.message.chat.id, namePrompt1.message_id, async (classData1) => {
                userSetting[userId]['code'] = classData1.text;
                //delete namePrompt message and reply message
                await bot.deleteMessage(query.message.chat.id, classData1.message_id);
                await bot.deleteMessage(query.message.chat.id, namePrompt1.message_id);
                const namePrompt2 = await bot.sendMessage(query.message.chat.id, "수업 추가 메뉴입니다.\n\n강사명을 보내주세요.\n(2/6)", {
                    reply_markup: {
                        force_reply: true,
                    },
                });
                bot.onReplyToMessage(query.message.chat.id, namePrompt2.message_id, async (classData2) => {
                    userSetting[userId]['teacher'] = classData2.text;
                    var message = '수업 추가 메뉴입니다.\n\n수업시수를 선택해주세요.\n(3/6)'
                    bot.editMessageText(message, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '3.5', callback_data: 'add_class_time_3.5' }],
                                [{ text: '7', callback_data: 'add_class_time_7' }],
                            ]
                        },
                    });
                    //delete namePrompt message and reply message
                    bot.deleteMessage(query.message.chat.id, classData2.message_id);
                    bot.deleteMessage(query.message.chat.id, namePrompt2.message_id);
                });
            });
        }
        if (data.includes('add_class_time_')) {
            userSetting[userId]['time'] = data.split('_')[3];
            userSetting[userId]['time'] = 3.5;

            var message = '수업 추가 메뉴입니다.\n\n과목명을 선택해주세요.\n(4/6)'
            bot.editMessageText(message, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '국어', callback_data: 'add_class_subject_국어' }],
                        [{ text: '영어', callback_data: 'add_class_subject_영어' }],
                        [{ text: '수학', callback_data: 'add_class_subject_수학' }],
                    ]
                },
            });
        }
        if (data.includes('add_class_subject_')) {
            userSetting[userId]['subject'] = data.split('_')[3];


            var message = '수업 추가 메뉴입니다.\n\n강의실을 선택해주세요.\n(5/6)'
            bot.editMessageText(message, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '201호', callback_data: 'add_class_room_201' }],
                        [{ text: '202호', callback_data: 'add_class_room_202' }],
                        [{ text: '203호', callback_data: 'add_class_room_203' }],
                        [{ text: '204호', callback_data: 'add_class_room_204' }],
                        [{ text: '205호', callback_data: 'add_class_room_205' }],
                        [{ text: '206호', callback_data: 'add_class_room_206' }],
                        [{ text: '207호', callback_data: 'add_class_room_207' }],
                        [{ text: '208호', callback_data: 'add_class_room_208' }],
                        [{ text: 'VIP실', callback_data: 'add_class_room_VIP' }]
                    ]
                },
            });
        }
        if (data.includes('add_class_room_')) {
            userSetting[userId]['room'] = data.split('_')[3];

            var message = '수업 추가 메뉴입니다.\n\n강의 요일을 선택해주세요.\n(6/6)'

            bot.editMessageText(message, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '일요일', callback_data: 'add_class_day_0' }],
                        [{ text: '월요일', callback_data: 'add_class_day_1' }],
                        [{ text: '화요일', callback_data: 'add_class_day_2' }],
                        [{ text: '수요일', callback_data: 'add_class_day_3' }],
                        [{ text: '목요일', callback_data: 'add_class_day_4' }],
                        [{ text: '금요일', callback_data: 'add_class_day_5' }],
                        [{ text: '토요일', callback_data: 'add_class_day_6' }],

                    ]
                },
            });
        }
        if (data.includes('add_class_day_')) {
            userSetting[userId]['day1'] = data.split('_')[3];

            var message = '수업 추가 메뉴입니다.\n\n수업 시간을 선택해주세요\n(6/6)'
            bot.editMessageText(message, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '오전', callback_data: 'add_class_partTime_1' }],
                        [{ text: '점심', callback_data: 'add_class_partTime_2' }],
                        [{ text: '저녁', callback_data: 'add_class_partTime_3' }],
                    ]
                },
            });
        }
        if (data.includes('add_class_partTime_')) {
            userSetting[userId]['partTime'] = data.split('_')[3];
            if (userSetting[userId]['time'] == 3.5) {
                // 최종 등록
                var message = '수업 추가 메뉴입니다.\n\n수업을 추가하시겠습니까?\n\n강의 코드: ' + userSetting[userId]['code'] + '\n과목: ' + userSetting[userId]['subject'] + '\n강의실: ' + userSetting[userId]['room'] + '\n강의 요일: ' + userSetting[userId]['day1'] + '\n강의 시간대: ' + userSetting[userId]['partTime'] + '\n\n(6/6)'
                bot.editMessageText(message, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '등록', callback_data: 'add_class_final_okay' }],
                            [{ text: '취소', callback_data: 'add_class_final_cancel' }],
                        ]
                    },
                });
            } else if (userSetting[userId]['time'] == 7) {
                var message = '수업 추가 메뉴입니다.\n\n7T 단과는 지원하지 않고 있으니, 수동으로 추가하세요.\n\n(6/6)'

                bot.editMessageText(message, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '메인 메뉴로 돌아가기', callback_data: 'main_menu' }],
                        ]
                    },
                });
            }
        }
        if (data.includes('add_class_final_')) {
            console.log('!!!!!!!!')
            if (data.split('_')[3] == 'okay') {
                var classDateInfo = []
                if (userSetting[userId]['time'] == 3.5) {
                    if (userSetting[userId]['partTime'] == 1) {
                        classDateInfo.push(`${userSetting[userId]['day1']}-2`)
                        classDateInfo.push(`${userSetting[userId]['day1']}-3`)
                    } else if (userSetting[userId]['partTime'] == 2) {
                        classDateInfo.push(`${userSetting[userId]['day1']}-4`)
                        classDateInfo.push(`${userSetting[userId]['day1']}-5`)
                        classDateInfo.push(`${userSetting[userId]['day1']}-6`)
                    } else if (userSetting[userId]['partTime'] == 3) {
                        classDateInfo.push(`${userSetting[userId]['day1']}-7`)
                        classDateInfo.push(`${userSetting[userId]['day1']}-8`)
                    }
                    registerSchedule(userSetting[userId]['code'], userSetting[userId]['time'], userSetting[userId]['teacher'], userSetting[userId]['subject'], userSetting[userId]['room'], classDateInfo);
                    var message = '수업 추가 메뉴입니다.\n\n등록이 완료되었습니다. ✅'
                    bot.editMessageText(message, {
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '메인 메뉴로 돌아가기', callback_data: 'main_menu' }],
                            ]
                        },
                    })


                }
            }
            if (data.split('_')[3] == 'cancel') {
                var message = '수업 추가 메뉴입니다.\n\n취소되었습니다.'
                bot.editMessageText(message, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '다시 등록하기', callback_data: 'add_class' }],
                            [{ text: '나가기', callback_data: 'add_class_delete' }],
                        ]
                    },
                });
            }
        }
        if (data.includes('add_class_delete')) {
            await bot.deleteMessage(chatId, messageId);
        }




    } catch (err) {
        console.log(err)
    }
})


// //WEB SERVER
// const app = express();
// const port = 3000;

// // 프론트 부분
// // 메인 루트 접근 시, public에 있는 index.html을 불러옴
// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/public/index.html');
// })
// //'settings' 루트 접근 시, public에 있는 settings.html을 불러옴
// app.get('/settings', (req, res) => {
//     res.sendFile(__dirname + '/public/settings.html');
// })
// //'manage' 루트 접근 시, public에 있는 manage.html을 불러옴
// app.get('/manage', (req, res) => {
//     res.sendFile(__dirname + '/public/manage.html');
// })

// // API 부분
// // 스케쥴 데이터를 불러옴



// // 서버 실행
// app.listen(port, () => {
//     console.log(`Example app listening at http://localhost:${port}`)
// })