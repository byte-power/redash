import { isString, get, find } from "lodash";
import sanitize from "@/services/sanitize";
import { axios } from "@/services/axios";
import notification from "@/services/notification";

function getErrorMessage(error) {
  return find([get(error, "response.data.message"), get(error, "response.statusText"), "Unknown error"], isString);
}

function disableResource(user) {
  return `api/applications/${user.id}`;
}

function enableApplication(user) {
  const userName = sanitize(user.name);

  return axios
    .delete(disableResource(user))
    .then(data => {
      notification.success(`App ${userName} is now enabled.`);
      user.is_disabled = false;
      user.profile_image_url = data.profile_image_url;
      return data;
    })
    .catch(error => {
      notification.error("Cannot enable app", getErrorMessage(error));
    });
}

function disableApplication(user) {
  const userName = sanitize(user.name);
  return axios
    .post(disableResource(user))
    .then(data => {
      notification.warning(`App ${userName} is now disabled.`);
      user.is_disabled = true;
      user.profile_image_url = data.profile_image_url;
      return data;
    })
    .catch(error => {
      notification.error("Cannot disable app", getErrorMessage(error));
    });
}

function deleteApplication(user) {
  const userName = sanitize(user.name);
  return axios
    .delete(`api/applications/${user.id}`)
    .then(data => {
      notification.warning(`App ${userName} has been deleted.`);
      return data;
    })
    .catch(error => {
      notification.error("Cannot delete app", getErrorMessage(error));
    });
}

function regenerateApiKey(user) {
  return axios
    .post(`api/applications/${user.id}/regenerate_secret_token`)
    .then(data => {
      notification.success("The secret token has been updated.");
      return data.api_key;
    })
    .catch(error => {
      notification.error("Failed regenerating secret token", getErrorMessage(error));
    });
}

const Application = {
  query: params => axios.get("api/applications", { params }),
  get: ({ id }) => axios.get(`api/applications/${id}`),
  create: data => axios.post(`api/applications`, data),
  save: data => axios.post(`api/applications/${data.id}`, data),
  enableApplication,
  disableApplication,
  deleteApplication,
  regenerateApiKey,
};

export default Application;
