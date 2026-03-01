-- Track AI token usage per report for cost analysis
alter table reports add column if not exists tokens_used integer;
