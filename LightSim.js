const mqtt = require('mqtt');
const readline = require('readline');
const brokerUrl = 'mqtt://broker.hivemq.com';
const mongoose = require('mongoose');

const client = mqtt.connect(brokerUrl);
mongoose.connect('mongodb+srv://cameronhum:mypass@sit314.i11ozah.mongodb.net/?retryWrites=true&w=majority');

const Light = mongoose.model('Light', new mongoose.Schema({
    id: Number,
    name: String,
    room: String,
    state: Number
}));



let lightData = {
    ID: 2,
    room: 'bedroom',
    state: false,
    name: 'bedroom light 2'
}

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.publish('SIT314/initialize', JSON.stringify(lightData), (err) => {
        if (err) {
            console.error('Error publishing message:', err);
        } else {
        }
    });
    const topic = 'SIT314' + '/devices/' + lightData.ID;
    client.subscribe(topic);

    const topicUmbrella = 'SIT314' + '/' + lightData.room;

    client.subscribe(topicUmbrella);

    client.on('message', (topic, message) => {
        if (message.toString() == 'ON') {
            lightData.state = true;
        }
        else {
            lightData.state = false;
        }
        console.log('light is ' + lightData.state);
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.on('line', (input) => {
        if (input === 'q') {
            lightData.state = !lightData.state;
            console.log('light is ' + lightData.state);
            const updateData = {
                state: lightData.state
            };
            Light.findOneAndUpdate({ id: lightData.ID }, updateData, { new: true })
                .then((updatedLight) => {
                    if (updatedLight) {
                        console.log('Updated Light:');
                        console.log(updatedLight);
                    } else {
                        console.log('Light not found.');
                    }
                    console.log('light is ' + lightData.state);

                })
                .catch((err) => {
                    console.error(err);
                });

        }
    });
});