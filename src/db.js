import mongoose from "mongoose";

export const model = mongoose.model;
export const ObjectId = mongoose.Schema.Types.ObjectId;

// open db connection
export const openDbConnection = async () => {
  const uri = process.env.MONGO_URL;
  return mongoose.connect(uri, {
    dbName: "asd_learning_app",
  });
};

// base schema
export const BaseSchema = (fields) => {
  return new mongoose.Schema(fields, {
    timestamps: true,
    versionKey: false,
  });
};
