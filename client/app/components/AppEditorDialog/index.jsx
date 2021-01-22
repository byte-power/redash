import React, { useState, useEffect, useCallback } from "react";
import { axios } from "@/services/axios";
import PropTypes from "prop-types";
import { each, debounce, get, find } from "lodash";
import Button from "antd/lib/button";
import List from "antd/lib/list";
import Modal from "antd/lib/modal";
import Select from "antd/lib/select";
import Tag from "antd/lib/tag";
import Tooltip from "antd/lib/tooltip";
import { wrap as wrapDialog, DialogPropType } from "@/components/DialogWrapper";
import { toHuman } from "@/lib/utils";
import HelpTrigger from "@/components/HelpTrigger";
import { AppPreviewCard } from "@/components/PreviewCard";
import notification from "@/services/notification";
import Application from "@/services/application";

import "./index.less";

const { Option } = Select;
const DEBOUNCE_SEARCH_DURATION = 200;

function useGrantees(url) {
  const loadGrantees = useCallback(() => {
    return axios.get(url).then(data => {
      return data;
    });
  }, [url]);

  const addPermission = useCallback(
    (userId, accessType = "modify") =>
      axios
        .post(url, { access_type: accessType, user_id: userId })
        .catch(() => notification.error("Could not grant permission to the user")),
    [url]
  );

  const removePermission = useCallback(
    (userId, accessType = "modify") =>
      axios
        .delete(url, { data: { access_type: accessType, user_id: userId } })
        .catch(() => notification.error("Could not remove permission from the user")),
    [url]
  );

  return { loadGrantees, addPermission, removePermission };
}

const searchApps = searchTerm =>
  Application.query({ q: searchTerm })
    .then(({ results }) => results)
    .catch(() => []);

function AppEditorDialogHeader({ context }) {
  return (
    <>
      Manage Application Permissions
      <div className="modal-header-desc">{`Sharing this ${context} is enabled for the application in this list. `}</div>
    </>
  );
}

AppEditorDialogHeader.propTypes = { context: PropTypes.oneOf(["query", "dashboard"]) };
AppEditorDialogHeader.defaultProps = { context: "query" };

function AppSelect({ onSelect, shouldShowUser }) {
  const [loadingApps, setLoadingApps] = useState(true);
  const [apps, setApps] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const debouncedSearchApps = useCallback(
    debounce(
      search =>
        searchApps(search)
          .then(setApps)
          .finally(() => setLoadingApps(false)),
      DEBOUNCE_SEARCH_DURATION
    ),
    []
  );

  useEffect(() => {
    setLoadingApps(true);
    debouncedSearchApps(searchTerm);
  }, [debouncedSearchApps, searchTerm]);

  return (
    <Select
      className="w-100 m-b-10"
      placeholder="Add apps..."
      showSearch
      onSearch={setSearchTerm}
      suffixIcon={loadingApps ? <i className="fa fa-spinner fa-pulse" /> : <i className="fa fa-search" />}
      filterOption={false}
      notFoundContent={null}
      value={undefined}
      getPopupContainer={trigger => trigger.parentNode}
      onSelect={onSelect}>
      {apps.filter(shouldShowUser).map(user => (
        <Option key={user.id} value={user.id}>
          <AppPreviewCard app={user} />
        </Option>
      ))}
    </Select>
  );
}

AppSelect.propTypes = {
  onSelect: PropTypes.func,
  shouldShowUser: PropTypes.func,
};
AppSelect.defaultProps = { onSelect: () => {}, shouldShowUser: () => true };

function AppEditorDialog({ dialog, author, context, aclUrl }) {
  const [loadingGrantees, setLoadingGrantees] = useState(true);
  const [grantees, setGrantees] = useState([]);
  const { loadGrantees, addPermission, removePermission } = useGrantees(aclUrl);
  const loadUsersWithPermissions = useCallback(() => {
    setLoadingGrantees(true);
    loadGrantees()
      .then(result => {
        setGrantees(result);
      })
      .catch(() => notification.error("Failed to load grantees list"))
      .finally(() => setLoadingGrantees(false));
  }, [loadGrantees]);

  const userHasPermission = useCallback(
    user => user.id === author.id || !!get(find(grantees, { id: user.id }), "accessType"),
    [author.id, grantees]
  );

  useEffect(() => {
    loadUsersWithPermissions();
  }, [aclUrl, loadUsersWithPermissions]);

  return (
    <Modal
      {...dialog.props}
      className="permissions-editor-dialog"
      title={<AppEditorDialogHeader context={context} />}
      footer={<Button onClick={dialog.dismiss}>Close</Button>}>
      {/* <AppSelect
        onSelect={userId => addPermission(userId).then(loadUsersWithPermissions)}
        shouldShowUser={user => !userHasPermission(user)}
      /> */}
      <div className="d-flex align-items-center m-t-5">
        <h5 className="flex-fill">Application with permissions</h5>
        {loadingGrantees && <i className="fa fa-spinner fa-pulse" />}
      </div>
      <div className="scrollbox p-5" style={{ maxHeight: "40vh" }}>
        <List
          size="small"
          dataSource={[...grantees]}
          renderItem={app => (
            <List.Item>
              <AppPreviewCard key={app.id} app={app}>
                <Tooltip title="Remove app permissions">
                  <i
                    className="fa fa-remove clickable"
                    onClick={() => removePermission(app.id).then(loadUsersWithPermissions)}
                  />
                </Tooltip>
              </AppPreviewCard>
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
}

AppEditorDialog.propTypes = {
  dialog: DialogPropType.isRequired,
  author: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  context: PropTypes.oneOf(["query", "dashboard"]),
  aclUrl: PropTypes.string.isRequired,
};

AppEditorDialog.defaultProps = { context: "query" };

export default wrapDialog(AppEditorDialog);
