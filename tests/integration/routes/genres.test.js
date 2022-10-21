const request = require('supertest')
const { Genre } = require('../../../models/genre');
const { User } = require('../../../models/user');
const mongoose = require('mongoose')
let server;


describe('/api/genres', () => {
    beforeEach(() => { server = require('../../../index') })
    afterEach(async () => { 
        await server.close();
        await Genre.deleteMany({})
     })

    describe('GET /', () => {
        it('should return all genres', async () => {
            await Genre.collection.insertMany([
                { name: 'genre1' },
                { name: 'genre2' }
            ])
            const res = await request(server).get('/api/genres')
            expect(res.status).toBe(200)
            expect(res.body.length).toBe(2)
            expect(res.body.some(g => g.name === 'genre1')).toBeTruthy()
            expect(res.body.some(g => g.name === 'genre2')).toBeTruthy()
        })
    })

    describe('GET /:id', () => {
        it('should return genre if valid id is passed', async () => {
            const genre = new Genre({ name: 'genre1' })
            await genre.save()

            const res = await request(server).get('/api/genres/' + genre._id)

            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('name', genre.name)
        })

        it('should return 404 if invalid id is passed', async () => {
            const res = await request(server).get('/api/genres/1')

            expect(res.status).toBe(404)
        })

        it('should return 404 if genre with given id does not exist', async () => {
            const id = mongoose.Types.ObjectId()
            const res = await request(server).get('/api/genres/' + id)

            expect(res.status).toBe(404)
        })
    })

    describe('POST /', () => {
        let token;
        let name;

        beforeEach(() => {
            token = new User().generateAuthToken();
            name = 'genre1'
        })

        const exec = () => {
            return request(server)
            .post('/api/genres')
            .set('x-auth-token', token)
            .send({ name: name })
        }

        it('should return a 401 if client is not logged in', async () => {
            token = ''

            const res = await exec()
            
            expect(res.status).toBe(401)
        })
        it('should return 400 if genre is less than 5 characters', async () => {
            name = '1234'

            const res = await exec()
            
            expect(res.status).toBe(400)
        })

        it('should return 400 if genre is greater than 50 characters', async () => {
            name = new Array(52).join('a')

            const res = await exec()
            
            expect(res.status).toBe(400)
        })

        it('should save the genre if it is valid', async () => {
            const res = await exec()
            
            const genre = await Genre.find({ name: name})

            expect(genre).not.toBeNull();
            expect(res.status).toBe(200)
        })
        it('should return the genre if it is valid', async () => {
            const res = await exec()
        
            expect(res.status).toBe(200)
            expect(res.body).toHaveProperty('_id')
            expect(res.body).toHaveProperty('name', 'genre1')
        })
    })

    describe('PUT /:id', () => {
        let id;
        let genre;
        let token;
        let newName;

        beforeEach(async () => {
            genre = new Genre({ name: 'genre1' })
            await genre.save()

            token = new User().generateAuthToken();
            id = genre._id
            newName = 'updated name'
        })

        const exec = async () => {
            return await request(server)
            .put('/api/genres/' + id)
            .set('x-auth-token', token)
            .send({ name: newName })
        }

        it('should return a 401 if the client is not logged in', async () => {
            token = ''

            const res = await exec()

            expect(res.status).toBe(401)
        })

        it('should return a 400 if the genre is less than 5 characters', async () => {
            newName = '1'

            const res = await exec()

            expect(res.status).toBe(400)
        })

        it('should return a 400 if the genre is greater than 50 characters', async () => {
            newName = 'fmadkafmdlfmlamofopwaieofamofmapofeoaipfmdopamfomasfioamfdmafiaopfdmaiofmdoap'

            const res = await exec()
            
            expect(res.status).toBe(400)
        })

        it('should return a 404 if the object id does not meet the specifications of an object id', async () => {
            id = '1'

            const res = await exec()

            expect(res.status).toBe(404)
        })

        it('should return a 404 if the object id is valid per the specificiations, but does not exist in the database', async () => {
            id = '62f56e774a9578ba0d730c61'

            const res = await exec()

            expect(res.status).toBe(404)
        })

        it('should return the updated genre if it is valid', async () => {
            const res = await exec()

            expect(res.status).toBe(200)
            expect(res.body.name).toBe(newName)
            expect(res.body._id).toMatch(id.toString())
        })

    })    

    describe('DELETE /:id', () => {
        let genre;
        let id;
        let token;
        let tokenWithAdmin;

        const exec = async () => {
            return await request(server)
            .delete('/api/genres/' + id)
            .set('x-auth-token', token)
            .send()
        }

        beforeEach(async () => {
            token = new User().generateAuthToken()
            tokenWithAdmin = new User({isAdmin: true}).generateAuthToken()

            genre = new Genre({ name: 'genre1' })
            await genre.save()

            id = genre._id
        })

        it('should retun a 401 if user is not logged in', async () => {
            token = ''

            const res = await exec();

            expect(res.status).toBe(401)
        })
        it('should return a 403 if user in not an admin', async () => {
            const res = await exec();

            expect(res.status).toBe(403)
        }) 
        it('should return a 404 if invalid Id objectId validation failed', async () => {
            token = tokenWithAdmin
            id = '1'

            const res = await exec()

            expect(res.status).toBe(404)
        })
        it('should return a 404 if ObjectId validation passed but genre with Id does not exist', async () => {
            token = tokenWithAdmin
            id = '62f56e774a9578ba0d730c61'

            const res = await exec();

            expect(res.status).toBe(404)
        }) 
        it('should return a 200 if genre successfully removed', async () => {
            token = tokenWithAdmin

            const res = await exec()

            expect(res.status).toBe(200)
        })
        it('should delete the genre if input is valid', async () => {
            token = tokenWithAdmin

            await exec()

            const genreInDb = await Genre.findById(id)

            expect(genreInDb).toBeNull()
        })
        it('should return the removed genre', async () => {
            token = tokenWithAdmin

            const res = await exec()

            expect(res.body).toHaveProperty('_id', id.toHexString())
            expect(res.body).toHaveProperty('name', genre.name);
        })
    })
})