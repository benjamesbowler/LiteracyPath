-- Keep tutorial-only stimulus lookups off the full published question bank.
begin;
create index literacy_mock_items_tutorial_stimulus_idx
  on public.literacy_mock_items (content_version, (item#>>'{itemSnapshot,stimulusKey}'))
  where item#>>'{itemSnapshot,tutorialOnly}'='true';
commit;
