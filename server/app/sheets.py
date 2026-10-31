import logging
from datetime import datetime
from zoneinfo import ZoneInfo

import gspread

from app.config import settings
from app.models import Rsvp

logger = logging.getLogger(__name__)
VN_TZ = ZoneInfo("Asia/Ho_Chi_Minh")


def append_rsvp(row: Rsvp) -> None:
    if not settings.google_sheet_id or not settings.google_credentials_file:
        return

    created = row.created_at
    if isinstance(created, datetime):
        if created.tzinfo is None:
            created = created.replace(tzinfo=ZoneInfo("UTC"))
        created = created.astimezone(VN_TZ).strftime("%Y-%m-%d %H:%M:%S")

    client = gspread.service_account(filename=settings.google_credentials_file)
    if hasattr(client, "http_client"):
        client.http_client.timeout = 20
    sheet = client.open_by_key(settings.google_sheet_id).worksheet(settings.google_sheet_tab)
    sheet.append_row(
        [row.id, row.full_name, row.attendees, row.stay or "", row.message or "", created],
        value_input_option="USER_ENTERED",
    )
    logger.info("Appended rsvp %s to Google Sheet", row.id)
