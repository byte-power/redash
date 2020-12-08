import { isEmpty, join } from "lodash";
import React from "react";
import Form from "antd/lib/form";
import Select from "antd/lib/select";
import Alert from "antd/lib/alert";
import DynamicComponent from "@/components/DynamicComponent";
import { clientConfig } from "@/services/auth";
import { SettingsEditorPropTypes, SettingsEditorDefaultProps } from "../prop-types";

export default function MicrosoftLoginSettings(props) {
  const { values, onChange } = props;

  if (!clientConfig.microsoftLoginEnabled) {
    return null;
  }

  return (
    <DynamicComponent name="OrganizationSettings.MicrosoftLoginSettings" {...props}>
      <h4>Microsoft Login</h4>
      <Form.Item label="Allowed Microsoft Apps Domains">
        <Select
          mode="tags"
          value={values.auth_microsoft_apps_domains}
          onChange={value => onChange({ auth_microsoft_apps_domains: value })}
        />
        {!isEmpty(values.auth_microsoft_apps_domains) && (
          <Alert
            message={
              <p>
                Any user registered with a <strong>{join(values.auth_microsoft_apps_domains, ", ")}</strong> Microsoft Apps
                account will be able to login. If they don't have an existing user, a new user will be created and join
                the <strong>Default</strong> group.
              </p>
            }
            className="m-t-15"
          />
        )}
      </Form.Item>
    </DynamicComponent>
  );
}

MicrosoftLoginSettings.propTypes = SettingsEditorPropTypes;

MicrosoftLoginSettings.defaultProps = SettingsEditorDefaultProps;
