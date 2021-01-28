import { axios } from "@/services/axios";
import { getMeta } from "@/lib/utils";
import { debounce, extend } from "lodash";

let events = [];
let token = getMeta("access-token");

const post = debounce(() => {
  const eventsToSend = events;
  events = [];

  axios.post(`api/events?access_token=${token}`, eventsToSend);
}, 1000);

export default function recordEvent(action, objectType, objectId, additionalProperties) {
  const event = {
    action,
    object_type: objectType,
    object_id: objectId,
    timestamp: Date.now() / 1000.0,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
  };
  extend(event, additionalProperties);
  events.push(event);

  post();
}
