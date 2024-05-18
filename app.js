const express = require('express')
const app = express()
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'moviesData.db')
let db = null

const initilizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}
module.exports = app

app.use(express.json())
const convertDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}
const convertDbObjectToResponseObjectForDirector = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
    movieName: dbObject.movie_name,
  }
}

initilizeDBAndServer()
app.use(express.json())
//Fetching the all Movies Names from MoviesDB
app.get('/movies/', async (request, response) => {
  const requestQuery = `
    SELECT movie_name
    FROM 
    movie;`
  const responseBody = await db.all(requestQuery)

  response.send(
    responseBody.map(eachMOvie => convertDbObjectToResponseObject(eachMOvie)),
  )
})
app.use(express.json())
//Creating a new movie in the MoviesDB, movie_id autoincrement
app.post('/movies/', async (request, response) => {
  const requestBody = request.body
  const {directorId, movieName, leadActor} = requestBody
  const movieQuery = `
  INSERT INTO movie (director_id, movie_name, lead_actor)
  VALUES (
    ${directorId},'${movieName}','${leadActor}'
  );`
  const dbResponse = await db.run(movieQuery)

  response.send('Movie Successfully Added')
})
app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const requestQuery = `
  SELECT *
  FROM 
  movie
  WHERE 
  movie_id=${movieId};`
  const dbResponses = await db.get(requestQuery)
  response.send(convertDbObjectToResponseObject(dbResponses))
})
//Updating the movie details
app.use(express.json())
app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const requestBody = request.body
  const {directorId, movieName, leadActor} = requestBody
  console.log(requestBody)
  console.log(directorId, movieId, leadActor)
  const updateQuery = `
  UPDATE movie
  SET
  director_id=${directorId},
  movie_name='${movieName}',
  lead_actor='${leadActor}'
  WHERE
  movie_id=${movieId};`
  await db.run(updateQuery)
  response.send('Movie Details Updated')
})
//Deleting a movie from movie database
app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteQuery = `
  DELETE
  FROM movie
  where
  movie_id=${movieId};`
  await db.run(deleteQuery)
  response.send('Movie Removed')
})

app.get('/directors/', async (request, response) => {
  const deatilsQuery = `
  SELECT *
  FROM
  director;`
  const responseQuery = await db.all(deatilsQuery)
  response.send(
    responseQuery.map(eachDirectorName =>
      convertDbObjectToResponseObjectForDirector(eachDirectorName),
    ),
  )
})
//API 7
app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const movieNamesQuery = `
  SELECT movie_name
  FROM 
  movie inner join director
  ON movie.director_id = director.director_id
  WHERE
  director.director_id=${directorId};`
  const moviesArray = await db.all(movieNamesQuery)
  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})
