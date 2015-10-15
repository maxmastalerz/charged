# Charged

## About

Charged is a multiplayer browser game constructed using NodeJS, SocketIO, ExpressJS. The game was originally based of bomberman and you can play it on the [US-server](http://us-charged.herokuapp.com/) or [EU-server](http://eu-charged.herokuapp.com/)

## Local install

```
git clone https://github.com/meaniostack/charged.git
npm install
```

## Running the app

```
node Server.js
```

Visit [localhost:8080](http://localhost:8080)

## Create a game room

Type in the desired name, player limit, and any of the five game modes:

- Free for all
- Teams
- Capture the flag
- King of the hill
- Humans vs bots

You may change any of the optional settings to change the game experience.

- Map size (The size of the map)
- Map visibility (The FOV of a player)(Cannot be larger than the map size)
- Bomb delay (Time in milliseconds until a bomb is detonated)
- Password (You can password protect your room with this)

Click `CREATE AND JOIN`

## Game instructions

Join an existing room or create one.
You may customize your room with optional settings.

- Move with WASD
- Place bombs with SPACE
- Place walls with B key
- Focus on chat with T key
- Focus on game with ESC


## Developer API

Can be found [here](https://github.com/meaniostack/charged/blob/master/api.md).

## Contribute

Pull requests, and ideas are greatly appreciated. Add me on Skype to discuss the project, or to become a team developer.
My username is: max.mastalerz