import { server } from "./server.js";
import { changeTypes, modelEvents } from "./constants.js";

// add mongo schema middleware
// and broadcast notifications on change
export const registerNotificationEvents = (modelName, schema) => {
  schema
    .post(modelEvents.SAVE, (data) => {
      console.log(`Broadcasting ${changeTypes.INSERT} notification for ${modelName}:`, data);
      server.io.emit('notification', {
        type: changeTypes.INSERT,
        model: modelName,
        data,
      });
    })
    .post(modelEvents.UPDATE, (data) => {
      console.log(`Broadcasting ${changeTypes.UPDATE} notification for ${modelName}:`, data);
      server.io.emit('notification', {
        type: changeTypes.UPDATE,
        model: modelName,
        data,
      });
    })
    .post(modelEvents.DELETE, (data) => {
      console.log(`Broadcasting ${changeTypes.DELETE} notification for ${modelName}:`, data);
      server.io.emit('notification', {
        type: changeTypes.DELETE,
        model: modelName,
        data,
      });
    });
};
