import sqlite3

class SQL:
    def __init__(self, database):
        self.database = database

    def execute(self, query, *params):
        """Execute query and return list-of-dicts for SELECT, lastrowid for writes."""
        conn = sqlite3.connect(self.database)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # If caller passed a single tuple/list as the single param, unwrap it
        if len(params) == 1 and isinstance(params[0], (tuple, list)):
            params = params[0]

        cur.execute(query, params or ())
        sql = query.lstrip().split(None, 1)[0].lower()

        if sql == "select":
            rows = cur.fetchall()
            result = [dict(r) for r in rows]
            conn.close()
            return result
        else:
            conn.commit()
            lastid = cur.lastrowid
            conn.close()
            return lastid