const request = require('supertest')
const mongoose = require('mongoose');
const {Rental, lateFee} = require('../../../models/rental')
const {User} = require('../../../models/user');
const { Movie } = require('../../../models/movie');

describe('/api/returns', () => {
    let server;
    let customerId;
    let movieId;
    let rental;
    let movie;
    let token;

    const exec = () => {
        return request(server)
            .post('/api/returns')
            .set('x-auth-token', token)
            .send({ customerId, movieId })
    }

    beforeEach(async () => { 
        server = require('../../../index')
        movieId = mongoose.Types.ObjectId()
        customerId = mongoose.Types.ObjectId()
        rental = new Rental({
            movie: movieId,
            customer: customerId
        })
        movie = new Movie({
            _id: movieId,
            title: "Testing testing 123",
            numberInStock: 1,
            dailyRentalRate: 10,
            genre: { name: "Mystery" }
        })
        token = new User().generateAuthToken()
        await rental.save()
        await movie.save()
    })
    afterEach(async () => {
        await server.close();
        await Rental.deleteMany({});
        await Movie.deleteMany({});
    })

    it('should return 401 if client is not logged in', async () => {
        token = ''
    
        const res = await exec()

        expect(res.status).toBe(401)
    })
    it('should return 400 if customerId is not provided', async () => {
        customerId = ''
        
        const res = await exec()

        expect(res.status).toBe(400)
    })

    it('should return 400 if movieId is not provided', async () => {
        movieId = ''
        
        const res = await exec()

        expect(res.status).toBe(400)
    })
    it('should return a 404 if no rental found for this customer/movie', async () => {
        await Rental.deleteMany({})
        
        const res = await exec()

        expect(res.status).toBe(404)
    })
    it('should return a 400 if rental found but already processed', async () => {
        rental.dateReturned = new Date();
        await rental.save()
        
        const res = await exec()

        expect(res.status).toBe(400)
    })
    it('should return a 200 if a rental is found and not already processed', async () => {
        const res = await exec()

        expect(res.status).toBe(200)
    })
    it('should update the dateReturned of the rental if valid request', async () => {
        const res = await exec()

        const rentalInDb = await Rental.findById(rental._id);

        const time = new Date() - rentalInDb.dateReturned;
        expect(rentalInDb.dateReturned).toBeDefined();
        expect(time).toBeLessThan(10 * 1000);          
        expect(res.status).toBe(200)
    })
    it('should update the rentalFee of the rental if valid request - on time return', async () => {
        rental.rentalStartDate = rental.rentalStartDate - 7*24*60*60*1000;
        await rental.save()
        const res = await exec()

        const rentalInDb = await Rental.findById(rental._id);

        const expectedRentalFee = movie.dailyRentalRate * ((rentalInDb.dateReturned - rentalInDb.rentalStartDate) / (1000 * 60 * 60 * 24))
        expect(rentalInDb.rentalFee).toBe(expectedRentalFee);
        expect(res.status).toBe(200)
    })
    it('should update the rentalFee of the rental if valid request - late return', async () => {
        rental.returnByDate = new Date(rental.rentalStartDate - 1000);
        await rental.save()
        const res = await exec()

        const rentalInDb = await Rental.findById(rental._id);

        const expectedRentalFee = movie.dailyRentalRate * ((rentalInDb.dateReturned - rentalInDb.rentalStartDate) / (1000 * 60 * 60 * 24))

        expect(rentalInDb.rentalFee).toBe(expectedRentalFee + lateFee);
        expect(res.status).toBe(200)
    })
    it('should increment the movie stock when a movie is returned', async () => {
        const currentStock = movie.numberInStock;

        const res = await exec()

        const movieInDb = await Movie.findById(movieId)

        expect(movieInDb.numberInStock).toBe(currentStock + 1)
    })
    it('should return the rental if the request is valid', async () => {
        const res = await exec();

        const rentalInDb = await Rental.findById(rental._id)
        
        expect(res.body).toHaveProperty('movie')
        expect(res.body).toHaveProperty('customer')
        expect(res.body).toHaveProperty('rentalStartDate')
        expect(res.body).toHaveProperty('returnByDate')
        expect(res.body).toHaveProperty('dateReturned')
        expect(res.body).toHaveProperty('rentalFee')


        //Alternatively
        expect(Object.keys(res.body)).toEqual(
            expect.arrayContaining(['movie', 'customer', 'rentalStartDate', 'returnByDate', 'dateReturned', 'rentalFee']))
    })
})