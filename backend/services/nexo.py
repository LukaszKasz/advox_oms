import os
from datetime import datetime
from typing import Any, Dict, List

import httpx

NEXO_API_BASE_URL = os.getenv("NEXO_API_BASE_URL", "http://localhost:5085").rstrip("/")
NEXO_OPERATOR_LOGIN = os.getenv("NEXO_OPERATOR_LOGIN", "Szef firmy")
NEXO_OPERATOR_PASSWORD = os.getenv("NEXO_OPERATOR_PASSWORD", "robocze")


class NexoClient:
    def __init__(self) -> None:
        self.base_url = NEXO_API_BASE_URL
        self.operator_login = NEXO_OPERATOR_LOGIN
        self.operator_password = NEXO_OPERATOR_PASSWORD

    def configure(
        self,
        base_url: str | None = None,
        operator_login: str | None = None,
        operator_password: str | None = None,
    ) -> None:
        if base_url is not None:
            self.base_url = (base_url or "").rstrip("/")
        if operator_login is not None:
            self.operator_login = operator_login or ""
        if operator_password is not None:
            self.operator_password = operator_password or ""

    async def _ensure_logged_in(self, client: httpx.AsyncClient) -> None:
        session_response = await client.get(f"{self.base_url}/api/nexo/session")
        session_response.raise_for_status()
        session_payload = session_response.json() or {}
        session_data = session_payload.get("data") or {}

        if session_payload.get("success") and session_data.get("isLoggedIn"):
            return

        login_response = await client.post(
            f"{self.base_url}/api/nexo/login",
            json={
                "operatorLogin": self.operator_login,
                "operatorPassword": self.operator_password,
            },
        )
        login_response.raise_for_status()
        login_payload = login_response.json() or {}
        if not login_payload.get("success"):
            raise RuntimeError(login_payload.get("error") or login_payload.get("message") or "Nexo login failed")

    async def get_latest_orders(self, limit: int = 20) -> List[Dict[str, Any]]:
        if not self.base_url:
            return []

        normalized_limit = max(1, min(limit, 100))

        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                await self._ensure_logged_in(client)
                response = await client.get(
                    f"{self.base_url}/api/nexo/zamowienia",
                    params={"limit": normalized_limit},
                )
                response.raise_for_status()

                payload = response.json() or {}
                if not payload.get("success"):
                    print(f"Nexo response was not success: {payload}")
                    return []

                orders = payload.get("data") or []
                mapped_orders: List[Dict[str, Any]] = []

                for order in orders:
                    created_at = order.get("dataWystawienia")
                    if created_at:
                        try:
                            created_at = datetime.fromisoformat(str(created_at).replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M:%S")
                        except ValueError:
                            created_at = str(created_at).replace("T", " ").replace("Z", "")
                    else:
                        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                    order_id = order.get("id")
                    reference = order.get("numer") or (f"Nexo order #{order_id}" if order_id else "Nexo order")
                    customer = order.get("kontrahent") or ""
                    total_paid = order.get("wartoscBrutto")
                    completion_status = order.get("stanKompletacji") or ""

                    mapped_orders.append(
                        {
                            "id": f"NX-{order_id}",
                            "reference": reference,
                            "id_customer": customer,
                            "total_paid": total_paid,
                            "payment": completion_status,
                            "date_add": created_at,
                            "source": "Nexo",
                        }
                    )

                return mapped_orders
            except Exception as e:
                print(f"Nexo Error: {e}")
                return []

    async def get_order_details(self, order_id: str) -> List[Dict[str, Any]]:
        _ = order_id
        return []


nexo_client = NexoClient()
