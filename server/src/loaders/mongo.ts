import mongoose from 'mongoose';

const mongoUrl = 'mongodb://localhost:27017/';

export const connect = async (db = 'actions'): Promise<void> => {
  mongoose.set('useCreateIndex', true);
  mongoose.set('useFindAndModify', false);
  try {
    await mongoose.connect(mongoUrl + db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

export const disconnect = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// careful !!!! only for test DB
export const dropDB = async (): Promise<void> => {
  await mongoose.connection.db.dropDatabase();
};
