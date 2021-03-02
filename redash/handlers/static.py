from flask import render_template, safe_join, send_file

from flask_login import login_required
from redash import settings
from redash.handlers import routes
from redash.handlers.authentication import base_href
from redash.handlers.base import org_scoped_rule
from redash.security import csp_allows_embeding


def render_index(access_token=None):
    access_token = "undefined" if access_token is None else access_token
    if settings.MULTI_ORG:
        response = render_template("multi_org.html", base_href=base_href(), access_token=access_token)
    else:
        ## TODO: maybe do it gracefully
        template_path = safe_join(settings.STATIC_ASSETS_PATH, "index.html")
        full_path = safe_join(settings.STATIC_ASSETS_PATH, "index_embed.html")
        with open(template_path, "r") as f1, open(full_path, "w") as f2:
            content = f1.read()
            template = content.replace("{{access_token}}", access_token)
            f2.write(template)
        response = send_file(full_path, **dict(cache_timeout=0, conditional=True))

    return response


@routes.route(org_scoped_rule("/dashboard/<slug>"), methods=["GET"])
@login_required
@csp_allows_embeding
def dashboard(slug, org_slug=None):
    return render_index()


@routes.route(org_scoped_rule("/<path:path>"))
@routes.route(org_scoped_rule("/"))
@login_required
def index(**kwargs):
    return render_index()
