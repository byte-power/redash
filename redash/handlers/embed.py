from flask import request
from flask_restful import abort

from .authentication import current_org
from flask_login import current_user, login_required
from redash import models
from redash.handlers import routes
from redash.handlers.base import get_object_or_404, org_scoped_rule, record_event
from redash.handlers.static import render_index
from redash.security import csp_allows_embeding


@routes.route(
    org_scoped_rule("/embed/query/<query_id>/visualization/<visualization_id>"),
    methods=["GET"],
)
@login_required
@csp_allows_embeding
def embed(query_id, visualization_id, org_slug=None):
    record_event(
        current_org,
        current_user._get_current_object(),
        {
            "action": "view",
            "object_id": visualization_id,
            "object_type": "visualization",
            "query_id": query_id,
            "embed": True,
            "referer": request.headers.get("Referer"),
        },
    )
    return render_index()

@routes.route(
    org_scoped_rule("/embed/dashboard/<dashboard_id>"),
    methods=["GET"],
)
@login_required
@csp_allows_embeding
def embed_dashboard(dashboard_id, org_slug=None):
    # check the application(current_user) has permissions to access this dashboard
    if not models.ApplicationDashboard.check_dashboard_in_application(current_user.id, dashboard_id):
        abort(403, message="Can't access to this dashboard.")

    ttl = current_org.get_setting("embed_api_access_token_ttl")
    access_token = models.AccessToken().new(ttl)
    record_event(
        current_org,
        current_user._get_current_object(),
        {
            "action": "view",
            "object_id": dashboard_id,
            "object_type": "dashboard",
            "embed": True,
            "referer": request.headers.get("Referer"),
        },
    )
    return render_index(access_token=access_token)


@routes.route(org_scoped_rule("/public/dashboards/<token>"), methods=["GET"])
@login_required
@csp_allows_embeding
def public_dashboard(token, org_slug=None):
    if current_user.is_api_user():
        dashboard = current_user.object
    else:
        api_key = get_object_or_404(models.ApiKey.get_by_api_key, token)
        dashboard = api_key.object

    record_event(
        current_org,
        current_user,
        {
            "action": "view",
            "object_id": dashboard.id,
            "object_type": "dashboard",
            "public": True,
            "headless": "embed" in request.args,
            "referer": request.headers.get("Referer"),
        },
    )
    return render_index()
