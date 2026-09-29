import assert from "node:assert/strict";
import test from "node:test";
import { dataRevision, requireCurrentRevision, validUniqueIds, versionedJson } from "./versioned-save";

test("bulk replacement refuses missing or stale data versions", () => {
  const current = [{ id: "existing", title: "已保存项目" }];
  assert.equal(versionedJson(current).headers.get("X-Data-Revision"), dataRevision(current));
  const missing = requireCurrentRevision(new Request("http://localhost/api/admin/projects"), current);
  assert.equal(missing?.status, 428);

  const stale = requireCurrentRevision(new Request("http://localhost/api/admin/projects", {
    headers: { "If-Match": dataRevision([]) },
  }), current);
  assert.equal(stale?.status, 409);

  const matching = requireCurrentRevision(new Request("http://localhost/api/admin/projects", {
    headers: { "If-Match": dataRevision(current) },
  }), current);
  assert.equal(matching, null);
});

test("bulk replacement rejects malformed and duplicate identifiers", () => {
  assert.equal(validUniqueIds([{ id: "same" }, { id: "same" }]), false);
  assert.equal(validUniqueIds([{ id: "" }]), false);
  assert.equal(validUniqueIds({ error: "failed load" }), false);
  assert.equal(validUniqueIds([{ id: "first" }]), true);
});
