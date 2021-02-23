import { isEmpty } from "lodash";
import React from "react";
import PropTypes from "prop-types";

import routeWithApiKeySession from "@/components/ApplicationArea/routeWithApiKeySession";
import Link from "@/components/Link";
import BigMessage from "@/components/BigMessage";
import PageHeader from "@/components/PageHeader";
import Parameters from "@/components/Parameters";
import DashboardGrid from "@/components/dashboards/DashboardGrid";
import Filters from "@/components/Filters";

import { Dashboard } from "@/services/dashboard";
import routes from "@/services/routes";
import { getToken } from "@/lib/utils";

import logoUrl from "@/assets/images/redash_icon_small.png";

import useDashboard from "./hooks/useDashboard";

import "./EmbedDashboardPage.less";

function EmbedDashboard({ dashboard }) {
  const { globalParameters, filters, setFilters, refreshDashboard, loadWidget, refreshWidget } = useDashboard(
    dashboard
  );

  return (
    <div className="container p-t-10 p-b-20">
      <PageHeader title={dashboard.name} />
      {!isEmpty(globalParameters) && (
        <div className="m-b-10 p-15 bg-white tiled">
          <Parameters parameters={globalParameters} filterParam={true} onValuesChange={refreshDashboard} />
        </div>
      )}
      {!isEmpty(filters) && (
        <div className="m-b-10 p-15 bg-white tiled">
          <Filters filters={filters} onChange={setFilters} />
        </div>
      )}
      <div id="dashboard-container">
        <DashboardGrid
          dashboard={dashboard}
          widgets={dashboard.widgets}
          filters={filters}
          hideHeader={true}
          isEditing={false}
          isPublic
          onLoadWidget={loadWidget}
          onRefreshWidget={refreshWidget}
        />
      </div>
    </div>
  );
}

EmbedDashboard.propTypes = {
  dashboard: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

class EmbedDashboardPage extends React.Component {
  static propTypes = {
    dashboardId: PropTypes.string.isRequired,
    onError: PropTypes.func,
  };

  static defaultProps = {
    onError: () => {},
  };

  state = {
    loading: true,
    dashboard: null,
  };

  componentDidMount() {
    Dashboard.getEmbed({ dashboard_id: this.props.dashboardId, token: this.props.token })
      .then(dashboard => {
        this.setState({ dashboard, loading: false });
      })
      .catch(error => this.props.onError(error));
  }

  render() {
    const { loading, dashboard } = this.state;
    return (
      <div className="public-dashboard-page">
        {loading ? (
          <div className="container loading-message">
            <BigMessage className="" icon="fa-spinner fa-2x fa-pulse" message="Loading..." />
          </div>
        ) : (
          <EmbedDashboard dashboard={dashboard} />
        )}
      </div>
    );
  }
}

routes.register(
  "Dashboards.EmbedViewOrEdit",
  routeWithApiKeySession({
    path: "/embed/dashboard/:dashboardId",
    mode: "embed",
    render: pageProps => {
      return <EmbedDashboardPage {...pageProps} token={getToken()} />;
    },
    getApiKey: currentRoute => {
      return getToken(true);
    },
  })
);
