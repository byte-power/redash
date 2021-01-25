import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import DynamicComponent from "@/components/DynamicComponent";
import { AppDetail } from "@/components/proptypes";
import { currentUser } from "@/services/auth";
import Application from "@/services/application";
import useImmutableCallback from "@/lib/hooks/useImmutableCallback";

export default function ToggleAppForm(props) {
  const { app, onChange } = props;

  const [loading, setLoading] = useState(false);
  const handleChange = useImmutableCallback(onChange);

  const toggleApp = useCallback(() => {
    const action = app.isDisabled ? Application.enableApplication : Application.disableApplication;
    setLoading(true);
    action(app)
      .then(data => {
        if (data) {
          handleChange(data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [app, handleChange]);

  if (!currentUser.isAdmin) {
    return null;
  }

  const buttonProps = {
    type: app.isDisabled ? "primary" : "danger",
    children: app.isDisabled ? "Enable App" : "Disable App",
  };

  return (
    <DynamicComponent name="AppDetail.ToggleAppForm">
      <Button className="w-100 m-t-10" onClick={toggleApp} loading={loading} {...buttonProps} />
    </DynamicComponent>
  );
}

ToggleAppForm.propTypes = {
  app: AppDetail.isRequired,
  onChange: PropTypes.func,
};

ToggleAppForm.defaultProps = {
  onChange: () => {},
};
