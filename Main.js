const express = require('express');
const mqtt = require('mqtt');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

const brokerUrl = 'mqtt://broker.hivemq.com';
mongoose.connect('mongodb+srv://cameronhum:mypass@sit314.i11ozah.mongodb.net/?retryWrites=true&w=majority');

const Light = mongoose.model('Light', new mongoose.Schema({
    id: Number,
    name: String,
    room: String,
    state: Number
}));


const client = mqtt.connect(brokerUrl);
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('SIT314/initialize');
    
    app.use(express.static('public'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });



    app.post('/delete', (req, res) => {
        Light.findOneAndDelete({ id: req.body.id })
            .then((deletedLight) => {
                if (deletedLight) {
                    console.log('Deleted Light:');
                    console.log(deletedLight);
                } else {
                    console.log('Light not found.');
                }
            })
            .catch((err) => {
                console.error(err);
            });
    });

    app.post('/toggle', (req, res) => {
        const updateData = {
            state: !req.body.state
        };

        Light.findOneAndUpdate({ id: req.body.id }, updateData, { new: true })
            .then((updatedLight) => {
                if (updatedLight) {
                    console.log('Updated Light:');
                    console.log(updatedLight);
                } else {
                    console.log('Light not found.');
                }
                const topic = 'SIT314' + '/devices/' + req.body.id;
                let message;
                if (!req.body.state) {
                    message = 'ON';
                } else {
                    message = 'OFF';
                }
                client.publish(topic, message, (err) => {

                    if (err) {
                        console.error('Error publishing message:', err);
                        res.status(500).json({ error: 'Error publishing message' });
                    } else {
                        console.log(`Published message: ${message}`);
                        res.json({ message: 'Message published successfully' });
                    }

                });
            })
            .catch((err) => {
                console.error(err);
            });
    });


    app.get('/api/lightData', async (req, res) => {
        try {
            const lights = await Light.find({});
            res.json(lights);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    client.on('message', (topic, message) => {
        lightData = JSON.parse(message.toString());
        console.log(lightData)
        const newLight = new Light({
            id: lightData.ID,
            name: lightData.name,
            room: lightData.room,
            state: lightData.state
        });

        newLight.save().then(doc => {
            console.log(doc);
        }).then(() => {
        });
    });
});