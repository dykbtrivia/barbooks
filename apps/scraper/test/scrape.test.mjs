import assert from "node:assert/strict";
import test from "node:test";
import { parseSearchQuery, parseTargetUrl, scrapeUrl, searchWeb } from "../src/scrape.mjs";

test("parseTargetUrl accepts and normalizes HTTP URLs",()=>assert.equal(parseTargetUrl(" https://example.com/products "),"https://example.com/products"));
test("parseTargetUrl rejects missing and unsupported URLs",()=>{assert.throws(()=>parseTargetUrl("example.com"),/complete URL/);assert.throws(()=>parseTargetUrl("file:///etc/passwd"),/Only http/);assert.throws(()=>parseTargetUrl(""),/Enter a URL/)});
test("scrapeUrl passes the normalized URL to Interfaze",async()=>{const calls=[];const client={tasks:{scrape:async url=>{calls.push(url);return{title:"Example"}}}};const response=await scrapeUrl(client,"https://example.com");assert.deepEqual(calls,["https://example.com/"]);assert.deepEqual(response,{url:"https://example.com/",result:{title:"Example"}})});

test("parseSearchQuery trims valid queries and rejects invalid ones",()=>{assert.equal(parseSearchQuery(" latest scores "),"latest scores");assert.throws(()=>parseSearchQuery(" "),/search query/);assert.throws(()=>parseSearchQuery("x".repeat(501)),/under 500/)});
test("searchWeb passes the normalized query to Interfaze",async()=>{const calls=[];const client={tasks:{webSearch:async query=>{calls.push(query);return{results:[]}}}};const response=await searchWeb(client," latest NFL news ");assert.deepEqual(calls,["latest NFL news"]);assert.deepEqual(response,{query:"latest NFL news",result:{results:[]}})});
