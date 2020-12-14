import time
from tests import BaseTestCase
from redash.models import db
from redash.authentication import get_embed_signature


class TestUnembedables(BaseTestCase):
    def test_not_embedable(self):
        query = self.factory.create_query()
        res = self.make_request("get", "/api/queries/{0}".format(query.id))
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors 'none'", res.headers["Content-Security-Policy"])
        self.assertEqual(res.headers["X-Frame-Options"], "deny")


class TestEmbedVisualization(BaseTestCase):
    def test_sucesss(self):
        vis = self.factory.create_visualization()
        vis.query_rel.latest_query_data = self.factory.create_query_result()
        db.session.add(vis.query_rel)

        res = self.make_request(
            "get",
            "/embed/query/{}/visualization/{}".format(vis.query_rel.id, vis.id),
            is_json=False,
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors *", res.headers["Content-Security-Policy"])
        self.assertNotIn("X-Frame-Options", res.headers)

class TestUnembedablesDashboard(BaseTestCase):
    def test_not_embedable(self):
        dashboard = self.factory.create_dashboard()
        res = self.make_request("get", "/api/dashboards/embed/{0}".format(dashboard.id))
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors 'none'", res.headers["Content-Security-Policy"])
        self.assertEqual(res.headers["X-Frame-Options"], "deny")

class TestEmbedDashboard(BaseTestCase):
    def test_not_add_dashboard_to_application(self):
        dashboard = self.factory.create_dashboard()
        application = self.factory.create_application()

        timestamp = int(time.time())
        path = "/embed/dashboard/{}?secret_key={}&timestamp={}".format(dashboard.id, application.secret_key, timestamp)
        url = "{}{}".format("http://localhost/default", path)
        signature = get_embed_signature(application.secret_token, url, timestamp)
        path = "{}&signature={}".format(path, signature)

        res = self.make_request(
            "get",
            path,
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 403)

    #
    # This is a bad way to write these tests, but the way Flask works doesn't make it easy to write them properly...
    #
    def test_success(self):
        dashboard = self.factory.create_dashboard()
        application = self.factory.create_application()
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=dashboard.id)

        timestamp = int(time.time())
        path = "/embed/dashboard/{}?secret_key={}&timestamp={}".format(dashboard.id, application.secret_key, timestamp)
        url = "{}{}".format("http://localhost/default", path)
        signature = get_embed_signature(application.secret_token, url, timestamp)
        path = "{}&signature={}".format(path, signature)

        res = self.make_request(
            "get",
            path,
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors *", res.headers["Content-Security-Policy"])
        self.assertNotIn("X-Frame-Options", res.headers)

    def test_works_for_logged_in_user(self):
        dashboard = self.factory.create_dashboard()
        application = self.factory.create_application()
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=dashboard.id)

        timestamp = int(time.time())
        path = "/embed/dashboard/{}?secret_key={}&timestamp={}".format(dashboard.id, application.secret_key, timestamp)
        url = "{}{}".format("http://localhost/default", path)
        signature = get_embed_signature(application.secret_token, url, timestamp)
        path = "{}&signature={}".format(path, signature)

        res = self.make_request(
            "get",
            path,
            is_json=False,
        )
        self.assertEqual(res.status_code, 200)

    def test_bad_serect_token(self):
        dashboard = self.factory.create_dashboard()
        application = self.factory.create_application()
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=dashboard.id)

        timestamp = int(time.time())
        path = "/embed/dashboard/{}?secret_key={}&timestamp={}".format(dashboard.id, application.secret_key, timestamp)
        url = "{}{}".format("http://localhost/default", path)
        signature = get_embed_signature("bad_api_serect", url, timestamp)
        path = "{}&signature={}".format(path, signature)

        res = self.make_request(
            "get",
            path,
            is_json=False,
        )
        self.assertEqual(res.status_code, 401)

    def test_deactive_appcliation(self):
        dashboard = self.factory.create_dashboard()
        application = self.factory.create_application(name="test_deactive_appcliation", active=False)
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=dashboard.id)

        timestamp = int(time.time())
        path = "/embed/dashboard/{}?secret_key={}&timestamp={}".format(dashboard.id, application.secret_key, timestamp)
        url = "{}{}".format("http://localhost/default", path)
        signature = get_embed_signature(application.secret_token, url, timestamp)
        path = "{}&signature={}".format(path, signature)

        res = self.make_request(
            "get",
            path,
            is_json=False,
        )
        self.assertEqual(res.status_code, 401)

# TODO: this should be applied to the new API endpoint
class TestPublicDashboard(BaseTestCase):
    def test_success(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard)

        res = self.make_request(
            "get",
            "/public/dashboards/{}".format(api_key.api_key),
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors *", res.headers["Content-Security-Policy"])
        self.assertNotIn("X-Frame-Options", res.headers)

    def test_works_for_logged_in_user(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard)

        res = self.make_request(
            "get", "/public/dashboards/{}".format(api_key.api_key), is_json=False
        )
        self.assertEqual(res.status_code, 200)

    def test_bad_token(self):
        res = self.make_request(
            "get", "/public/dashboards/bad-token", user=False, is_json=False
        )
        self.assertEqual(res.status_code, 302)

    def test_inactive_token(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard, active=False)
        res = self.make_request(
            "get",
            "/public/dashboards/{}".format(api_key.api_key),
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 302)

    # Not relevant for now, as tokens in api_keys table are only created for dashboards. Once this changes, we should
    # add this test.
    # def test_token_doesnt_belong_to_dashboard(self):
    #     pass


class TestAPIPublicDashboard(BaseTestCase):
    def test_success(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard)

        res = self.make_request(
            "get",
            "/api/dashboards/public/{}".format(api_key.api_key),
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors *", res.headers["Content-Security-Policy"])
        self.assertNotIn("X-Frame-Options", res.headers)

    def test_works_for_logged_in_user(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard)

        res = self.make_request(
            "get", "/api/dashboards/public/{}".format(api_key.api_key), is_json=False
        )
        self.assertEqual(res.status_code, 200)

    def test_bad_token(self):
        res = self.make_request(
            "get", "/api/dashboards/public/bad-token", user=False, is_json=False
        )
        self.assertEqual(res.status_code, 404)

    def test_inactive_token(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard, active=False)
        res = self.make_request(
            "get",
            "/api/dashboards/public/{}".format(api_key.api_key),
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 404)

    # Not relevant for now, as tokens in api_keys table are only created for dashboards. Once this changes, we should
    # add this test.
    # def test_token_doesnt_belong_to_dashboard(self):
    #     pass