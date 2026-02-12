import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import { buildApp } from "../src/app";
import { LunarHour, LunarSect2EightCharProvider, SolarTime } from "tyme4ts";

function runPrismaMigrateDeploy(databaseUrl: string) {
  const result = Bun.spawnSync(
    ["bunx", "prisma", "migrate", "deploy", "--config", "prisma.config.ts"],
    {
      cwd: path.resolve(import.meta.dir, "../.."),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  if (result.exitCode !== 0) {
    const stderr = new TextDecoder().decode(result.stderr);
    const stdout = new TextDecoder().decode(result.stdout);
    throw new Error(`prisma migrate deploy failed\nstdout:\n${stdout}\nstderr:\n${stderr}`);
  }
}

async function registerAndGetToken(app: ReturnType<typeof buildApp>) {
  const email = `u${Date.now()}@example.com`;
  const password = "password123";
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password },
  });
  expect(res.statusCode).toBe(201);
  const body = res.json() as { accessToken: string };
  expect(typeof body.accessToken).toBe("string");
  return body.accessToken;
}

describe("bazi module persistence", () => {
  const testDbDir = path.resolve(import.meta.dir, "../../.context/test-dbs");
  const testDbPath = path.join(testDbDir, `bazi-${Date.now()}.db`);
  const databaseUrl = `file:${testDbPath}`;

  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    fs.mkdirSync(testDbDir, { recursive: true });
    runPrismaMigrateDeploy(databaseUrl);
    app = buildApp({ databaseUrl, logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    try {
      fs.rmSync(testDbPath);
    } catch {
      // ignore
    }
  });

  it("creates customer + event + bazi record and supports CRUD", async () => {
    const tokenA = await registerAndGetToken(app);

    const createCustomer = await app.inject({
      method: "POST",
      url: "/api/customers",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        name: "张三",
        gender: "male",
        birthDate: "1985-06-15",
        birthTime: "10:30",
        phone: "13800138000",
        tags: ["重要客户"],
        notes: "备注",
        customFields: { k: "v" },
      },
    });
    expect(createCustomer.statusCode).toBe(201);
    const customer = (createCustomer.json() as { customer: { id: string; name: string } }).customer;
    expect(customer.name).toBe("张三");

    const addEvent = await app.inject({
      method: "POST",
      url: `/api/customers/${customer.id}/events`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        occurredAt: "2010-01-01T00:00:00.000Z",
        description: "创业",
        tags: ["事业"],
      },
    });
    expect(addEvent.statusCode).toBe(201);
    const event = (addEvent.json() as { event: { id: string; customerId: string } }).event;
    expect(event.customerId).toBe(customer.id);

    const listEvents = await app.inject({
      method: "GET",
      url: `/api/customers/${customer.id}/events`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(listEvents.statusCode).toBe(200);
    const events = (listEvents.json() as { events: Array<{ id: string }> }).events;
    expect(events.some((e) => e.id === event.id)).toBe(true);

    const createRecord = await app.inject({
      method: "POST",
      url: "/api/records",
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        customerId: customer.id,
        module: "bazi",
        subject: "事业大运详批",
        notes: "日主强旺",
        tags: ["事业"],
        baziData: {
          birthDate: "1985-06-15T10:30:00+08:00",
          location: "北京市 北京市 --",
          isEarlyLateZi: false,
        },
        verifiedStatus: "unverified",
        verifiedNotes: "",
      },
    });
    expect(createRecord.statusCode).toBe(201);
    const record = (createRecord.json() as {
      record: {
        id: string;
        module: string;
        customerId: string;
        tags: string[];
        baziData: { birthDate: string; yearStem: string; yearBranch: string; derived?: unknown };
      };
    }).record;
    expect(record.module).toBe("bazi");
    expect(record.customerId).toBe(customer.id);
    expect(record.tags).toEqual(["事业"]);
    expect(record.baziData.birthDate).toBe("1985-06-15T10:30:00+08:00");

    LunarHour.provider = new LunarSect2EightCharProvider();
    const solarTime = SolarTime.fromYmdHms(1985, 6, 15, 10, 30, 0);
    const eightChar = solarTime.getLunarHour().getEightChar();
    expect(record.baziData.yearStem).toBe(eightChar.getYear().getHeavenStem().getName());
    expect(record.baziData.yearBranch).toBe(eightChar.getYear().getEarthBranch().getName());
    expect(record.baziData.derived).toBeTruthy();

    const listBazi = await app.inject({
      method: "GET",
      url: "/api/records?module=bazi",
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(listBazi.statusCode).toBe(200);
    const listed = (listBazi.json() as { records: Array<{ id: string; tags: string[] }> }).records;
    const listedRecord = listed.find((r) => r.id === record.id);
    expect(listedRecord).toBeTruthy();
    expect(listedRecord?.tags).toEqual(["事业"]);

    const updateRecord = await app.inject({
      method: "PUT",
      url: `/api/records/${record.id}`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { notes: "更新后的断语", verifiedStatus: "accurate", tags: ["事业", "重点"] },
    });
    expect(updateRecord.statusCode).toBe(200);
    const updated = (updateRecord.json() as {
      record: { notes: string; verifiedStatus: string; tags: string[] };
    }).record;
    expect(updated.notes).toBe("更新后的断语");
    expect(updated.verifiedStatus).toBe("accurate");
    expect(updated.tags).toEqual(["事业", "重点"]);

    const getRecord = await app.inject({
      method: "GET",
      url: `/api/records/${record.id}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(getRecord.statusCode).toBe(200);

    const tokenB = await registerAndGetToken(app);
    const forbidden = await app.inject({
      method: "GET",
      url: `/api/records/${record.id}`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(forbidden.statusCode).toBe(404);

    const delEvent = await app.inject({
      method: "DELETE",
      url: `/api/customers/${customer.id}/events/${event.id}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(delEvent.statusCode).toBe(204);

    const delRecord = await app.inject({
      method: "DELETE",
      url: `/api/records/${record.id}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(delRecord.statusCode).toBe(204);

    const delCustomer = await app.inject({
      method: "DELETE",
      url: `/api/customers/${customer.id}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(delCustomer.statusCode).toBe(204);
  });
});
