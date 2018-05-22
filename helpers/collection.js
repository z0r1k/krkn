module.exports = () => {
  return require('mongodb').MongoClient
    .connect(process.env.DB, { useNewUrlParser: true })

    .then(client => {
      const db = client.db(process.env.DB_NAME);

      return db
        .createCollection(process.env.COL_NAME)

        .catch(err => {
          if (err.codeName === 'NamespaceExists') {
            return db.collection(process.env.COL_NAME)
          }
          return Promise.reject(err);
        });
    })
};
