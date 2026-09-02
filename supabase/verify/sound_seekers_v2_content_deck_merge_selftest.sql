-- SOUND_SEEKERS_CONTENT_DECK_SQL_SELFTEST
-- Executed only inside the runner-owned socket-only cluster.
-- Coverage vocabulary exercised below: contentPlacement, model_pending,
-- narrativeChoiceToken, attemptReceipts, attempt_receipt,
-- attempt_receipt_conflict, inputSha256, decisionOrdinal,
-- correctionRecordIds, story-transfer, connected_text_transfer,
-- novel_decoding, raw orphan retained, reciprocal validity restored,
-- receipt conflict invalidates dependent use.

do $$
declare
  empty_decks jsonb;
  heart_visit jsonb;
  heart_use jsonb;
  heart_shared_use jsonb;
  alt_visit jsonb;
  alt_use jsonb;
  alt_event jsonb;
  alt_event_final jsonb;
  alt_receipt jsonb;
  alt_receipt_final jsonb;
  truncated_receipt jsonb;
  truncated_decks jsonb;
  alt_decks jsonb;
  receipts jsonb;
  projected jsonb;
  merged jsonb;
  conflict jsonb;
  story_visit jsonb;
  transfer_visit jsonb;
  story_use jsonb;
  transfer_use jsonb;
  story_event jsonb;
  story_receipt jsonb;
  story_decks jsonb;
  morphology_visit jsonb;
  morphology_use jsonb;
  morphology_receipt jsonb;
  morphology_decks jsonb;
  state_a jsonb;
  state_b jsonb;
  state_c jsonb;
begin
  if public.lp_quest_normalize_v2_activity_type(
    'heart_word_mapping', ' encoding '
  ) <> 'encoding' then
    raise exception 'heart activity normalization failed';
  end if;
  if public.lp_quest_normalize_v2_activity_type(
    'word_decoding', 'encoding'
  ) is not null then
    raise exception 'non-heart activity escaped its domain';
  end if;

  if public.lp_quest_union_v2_evidence(
    '[{"id":"same","at":1,"domain":"heart_word_mapping","activityType":" encoding "}]',
    '[{"id":"same","at":1,"domain":"heart_word_mapping","activityType":"encoding"}]'
  ) #>> '{0,activityType}' <> 'encoding' then
    raise exception 'activity was not normalized before evidence grouping';
  end if;
  if public.lp_quest_union_v2_evidence(
    '[{"id":"non-heart","at":1,"domain":"word_decoding","activityType":"encoding","word":null,"position":null,"connectedTextId":null,"bossTransferId":null}]',
    '[]'
  ) #> '{0}' ? 'activityType' then
    raise exception 'non-heart evidence retained activityType';
  end if;

  empty_decks := public.lp_quest_merge_v2_content_decks('{}', '{}');
  if (select count(*) from jsonb_object_keys(empty_decks)) <> 5
    or empty_decks #> '{morphology,visits}' <> '{}'::jsonb
    or empty_decks #> '{transfer,uses}' <> '{}'::jsonb then
    raise exception 'older save did not gain five exact empty decks';
  end if;

  heart_visit := jsonb_build_object(
    'kind','visit','visitId','heart-visit','contentInstanceId','heart-content-instance:slot',
    'visitOwnerId','heart-owner','ownerActionUseId','heart-owner:content-use',
    'category','heartWords','slotId','heart-slot','recordId','hw:a',
    'contentId','heart-word:a','targetId','hw:a','wordId','a','stopId','s1',
    'journeyStep',1,'ownerActivityType',' recognition '
  );
  heart_use := jsonb_build_object(
    'kind','use','useId','heart-visit:heart-owner:content-use','visitId','heart-visit',
    'contentInstanceId','heart-content-instance:slot','visitOwnerId','heart-owner',
    'actionUseId','heart-owner:content-use','category','heartWords','slotId','heart-slot',
    'recordId','hw:a','journeyStep',1,'activityType',' recognition '
  );
  merged := public.lp_quest_merge_v2_content_decks(
    jsonb_build_object('heartWords', jsonb_build_object(
      'visits', jsonb_build_object('heart-visit', heart_visit),
      'uses', jsonb_build_object(heart_use ->> 'useId', heart_use)
    )), '{}'
  );
  if merged #>> '{heartWords,visits,heart-visit,ownerActivityType}' <> 'recognition'
    or merged #>> '{heartWords,uses,heart-visit:heart-owner:content-use,activityType}'
      <> 'recognition' then
    raise exception 'heart visit/use normalization failed';
  end if;
  heart_shared_use := heart_use || jsonb_build_object(
    'useId','heart-visit:shared-use','actionUseId','shared-use',
    'activityType','heart_part_mapping'
  );
  projected := public.lp_quest_valid_v2_content_decks(
    jsonb_build_object('heartWords', jsonb_build_object(
      'visits', jsonb_build_object('heart-visit', heart_visit),
      'uses', jsonb_build_object(
        heart_use ->> 'useId', heart_use || jsonb_build_object('slotId','tampered-slot'),
        heart_shared_use ->> 'useId', heart_shared_use
      )
    )), '{}', '[]'
  );
  if projected #> '{heartWords,uses,heart-visit:shared-use}' is not null then
    raise exception 'shared heart use survived a structurally invalid owner';
  end if;
  conflict := public.lp_quest_merge_v2_content_decks(
    merged,
    jsonb_build_object('heartWords', jsonb_build_object(
      'visits', jsonb_build_object('heart-visit', heart_visit || jsonb_build_object('recordId','hw:the')),
      'uses', '{}'::jsonb
    ))
  );
  if conflict #>> '{heartWords,visits,heart-visit,kind}' <> 'visit_conflict'
    or public.lp_quest_merge_v2_content_decks(conflict, merged)
      #>> '{heartWords,visits,heart-visit,kind}' <> 'visit_conflict' then
    raise exception 'visit conflict was not absorbing';
  end if;

  alt_visit := jsonb_build_object(
    'kind','visit','visitId','alt-visit','contentInstanceId','alternatives-content-instance:alternative-slot-s16',
    'visitOwnerId','s16-alternative','ownerActionUseId','s16-alternative:content-use',
    'category','alternatives','slotId','alternative-slot-s16','recordId','alternative:s16',
    'contentId','alternative:s16','targetId',null,'wordId',null,'stopId','s16','journeyStep',16
  );
  alt_event := jsonb_build_object(
    'id','content-placement-attempt:alt-visit:s16-alternative:0:0:0',
    'at','2026-09-02T00:00:00.000Z','evidenceKind','practice',
    'correct',true,'supportLevel',0,'revealed',false
  );
  alt_event_final := jsonb_build_object(
    'id','content-placement-attempt:alt-visit:s16-alternative:1:0:0',
    'at','2026-09-02T00:00:01.000Z','evidenceKind','practice',
    'correct',true,'supportLevel',0,'revealed',false
  );
  alt_use := jsonb_build_object(
    'kind','use','useId','alt-use','visitId','alt-visit',
    'contentInstanceId','alternatives-content-instance:alternative-slot-s16',
    'visitOwnerId','s16-alternative','actionUseId','s16-alternative:content-use',
    'category','alternatives','slotId','alternative-slot-s16','recordId','alternative:s16',
    'journeyStep',16,
    'attemptReceiptIds',jsonb_build_array(
      'content-placement-attempt:alt-visit:s16-alternative:0:0',
      'content-placement-attempt:alt-visit:s16-alternative:1:0'
    )
  );
  alt_receipt := jsonb_build_object(
    'kind','attempt_receipt','attemptId','content-placement-attempt:alt-visit:s16-alternative:0:0',
    'operation','content_placement','subjectId','s16-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,
    'inputSha256',repeat('a',64),'completed',false,
    'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(alt_event ->> 'id'),
    'useIds','[]'::jsonb
  );
  alt_receipt_final := jsonb_build_object(
    'kind','attempt_receipt','attemptId','content-placement-attempt:alt-visit:s16-alternative:1:0',
    'operation','content_placement','subjectId','s16-alternative',
    'decisionOrdinal',1,'attemptOrdinal',0,
    'inputSha256',repeat('b',64),'completed',true,
    'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(alt_event_final ->> 'id'),
    'useIds',jsonb_build_array('alt-use')
  );
  alt_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'alternatives',jsonb_build_object(
      'visits',jsonb_build_object('alt-visit',alt_visit),
      'uses',jsonb_build_object('alt-use',alt_use)
    )
  ), '{}');
  receipts := public.lp_quest_union_v2_attempt_receipts(
    jsonb_build_object(
      alt_receipt ->> 'attemptId', alt_receipt,
      alt_receipt_final ->> 'attemptId', alt_receipt_final
    ), '{}'
  );
  projected := public.lp_quest_valid_v2_attempt_receipts(
    jsonb_build_array(alt_event,alt_event_final), alt_decks, receipts
  );
  if not (projected ? (alt_receipt ->> 'attemptId'))
    or not (projected ? (alt_receipt_final ->> 'attemptId')) then
    raise exception 'valid full alternative receipt chain was rejected';
  end if;
  projected := public.lp_quest_valid_v2_content_decks(
    alt_decks, receipts, jsonb_build_array(alt_event,alt_event_final)
  );
  if projected #>> '{alternatives,uses,alt-use,kind}' <> 'use' then
    raise exception 'valid alternative use was rejected';
  end if;
  if public.lp_quest_valid_v2_content_decks(
    alt_decks, receipts, '[]'
  ) #> '{alternatives,uses,alt-use}' is not null then
    raise exception 'raw orphan retained but missing event awarded validity';
  end if;
  if public.lp_quest_valid_v2_content_decks(
    alt_decks, receipts, jsonb_build_array(alt_event,alt_event_final)
  ) #>> '{alternatives,uses,alt-use,kind}' <> 'use' then
    raise exception 'missing evidence did not restore validity';
  end if;

  truncated_receipt := alt_receipt || jsonb_build_object(
    'completed',true,'useIds',jsonb_build_array('alt-use')
  );
  truncated_decks := public.lp_quest_merge_v2_content_decks(
    jsonb_build_object('alternatives',jsonb_build_object(
      'visits',jsonb_build_object('alt-visit',alt_visit),
      'uses',jsonb_build_object('alt-use',alt_use || jsonb_build_object(
        'attemptReceiptIds',jsonb_build_array(alt_receipt ->> 'attemptId')
      ))
    )), '{}'
  );
  if public.lp_quest_valid_v2_content_decks(
    truncated_decks,
    jsonb_build_object(truncated_receipt ->> 'attemptId',truncated_receipt),
    jsonb_build_array(alt_event)
  ) #> '{alternatives,uses,alt-use}' is not null then
    raise exception 'truncated canonical alternative chain was accepted';
  end if;

  conflict := public.lp_quest_union_v2_attempt_receipts(
    receipts,
    jsonb_build_object(alt_receipt ->> 'attemptId',
      alt_receipt || jsonb_build_object('inputSha256',repeat('b',64)))
  );
  if conflict #>> array[alt_receipt ->> 'attemptId','kind'] <> 'attempt_receipt_conflict'
    or public.lp_quest_valid_v2_content_decks(
      alt_decks, conflict, jsonb_build_array(alt_event)
    ) #> '{alternatives,uses,alt-use}' is not null then
    raise exception 'receipt conflict invalidates dependent use failed';
  end if;

  story_visit := jsonb_build_object(
    'kind','visit','visitId','story-visit','contentInstanceId','stories-content-instance:story-slot-s1',
    'visitOwnerId','s1-story','ownerActionUseId','s1-story:content-use',
    'category','stories','slotId','story-slot-s1','recordId','story:scene-s1',
    'contentId','scene-s1','targetId','text:scene-s1','wordId',null,'stopId','s1','journeyStep',1
  );
  transfer_visit := jsonb_build_object(
    'kind','visit','visitId','transfer-visit','contentInstanceId','transfer-content-instance:transfer-slot-s1',
    'visitOwnerId','s1-transfer','ownerActionUseId','s1-transfer:content-use',
    'category','transfer','slotId','transfer-slot-s1','recordId','transfer:s1',
    'contentId','transfer:s1','targetId','text:scene-s1','wordId',null,'stopId','s1','journeyStep',1
  );
  story_event := jsonb_build_object(
    'id','story-transfer-attempt:journey:1:s1:0:0','at','2026-09-02T00:01:00.000Z',
    'evidenceKind','practice','domain','connected_text_transfer',
    'correct',true,'supportLevel',0,'revealed',false
  );
  story_use := jsonb_build_object(
    'kind','use','useId','story-use','visitId','story-visit',
    'contentInstanceId','stories-content-instance:story-slot-s1','visitOwnerId','s1-story',
    'actionUseId','s1-story:content-use','category','stories','slotId','story-slot-s1',
    'recordId','story:scene-s1','journeyStep',1,'transactionId','journey:1:s1',
    'pairedUseId','transfer-use','evidenceEventId',story_event ->> 'id',
    'narrativeChoiceToken',null,
    'attemptReceiptIds',jsonb_build_array('story-transfer-attempt:journey:1:s1:0')
  );
  transfer_use := jsonb_build_object(
    'kind','use','useId','transfer-use','visitId','transfer-visit',
    'contentInstanceId','transfer-content-instance:transfer-slot-s1','visitOwnerId','s1-transfer',
    'actionUseId','s1-transfer:content-use','category','transfer','slotId','transfer-slot-s1',
    'recordId','transfer:s1','journeyStep',1,'transactionId','journey:1:s1',
    'pairedUseId','story-use','evidenceEventId',story_event ->> 'id',
    'narrativeChoiceToken',null,
    'attemptReceiptIds',jsonb_build_array('story-transfer-attempt:journey:1:s1:0')
  );
  story_receipt := jsonb_build_object(
    'kind','attempt_receipt','attemptId','story-transfer-attempt:journey:1:s1:0',
    'operation','story_transfer','subjectId','journey:1:s1',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('c',64),
    'completed',true,'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(story_event ->> 'id'),
    'useIds',jsonb_build_array('story-use','transfer-use')
  );
  story_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'stories',jsonb_build_object('visits',jsonb_build_object('story-visit',story_visit),
      'uses',jsonb_build_object('story-use',story_use)),
    'transfer',jsonb_build_object('visits',jsonb_build_object('transfer-visit',transfer_visit),
      'uses',jsonb_build_object('transfer-use',transfer_use))
  ), '{}');
  projected := public.lp_quest_valid_v2_content_decks(
    story_decks,
    jsonb_build_object(story_receipt ->> 'attemptId',story_receipt),
    jsonb_build_array(story_event)
  );
  if projected #>> '{stories,uses,story-use,pairedUseId}' <> 'transfer-use'
    or projected #>> '{transfer,uses,transfer-use,pairedUseId}' <> 'story-use' then
    raise exception 'reciprocal validity restored projection failed';
  end if;
  if (projected #> '{stories,uses,story-use,narrativeChoiceToken}') <> 'null'::jsonb
    or (projected #> '{transfer,uses,transfer-use,narrativeChoiceToken}') <> 'null'::jsonb then
    raise exception 'non-boss narrative token was not exact null';
  end if;

  morphology_visit := jsonb_build_object(
    'kind','visit','visitId','morph-visit','contentInstanceId','morphology-content-instance:morphology-slot-s38',
    'visitOwnerId','s38-morphology','ownerActionUseId','s38-morphology:content-use',
    'category','morphology','slotId','morphology-slot-s38','recordId','morphology:s38:suffix_s',
    'contentId','morphology:suffix_s:cats','targetId',null,'wordId','cats','stopId','s38','journeyStep',38
  );
  morphology_use := jsonb_build_object(
    'kind','use','useId','morph-use','visitId','morph-visit',
    'contentInstanceId','morphology-content-instance:morphology-slot-s38',
    'visitOwnerId','s38-morphology','actionUseId','s38-morphology:content-use',
    'category','morphology','slotId','morphology-slot-s38','recordId','morphology:s38:suffix_s',
    'journeyStep',38,
    'attemptReceiptIds',jsonb_build_array('content-placement-attempt:morph-visit:s38-morphology:0:0')
  );
  morphology_receipt := jsonb_build_object(
    'kind','attempt_receipt','attemptId','content-placement-attempt:morph-visit:s38-morphology:0:0',
    'operation','content_placement','subjectId','s38-morphology','decisionOrdinal',0,
    'attemptOrdinal',0,'inputSha256',repeat('d',64),'completed',true,
    'correctionRecordIds','[]'::jsonb,'eventIds','[]'::jsonb,'useIds',jsonb_build_array('morph-use')
  );
  morphology_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'morphology',jsonb_build_object('visits',jsonb_build_object('morph-visit',morphology_visit),
      'uses',jsonb_build_object('morph-use',morphology_use))
  ), '{}');
  projected := public.lp_quest_valid_v2_content_decks(
    morphology_decks,
    jsonb_build_object(morphology_receipt ->> 'attemptId',morphology_receipt),
    '[]'
  );
  if projected #>> '{morphology,uses,morph-use,kind}' <> 'use' then
    raise exception 'zero-event morphology exposure failed';
  end if;

  state_a := jsonb_build_object(
    'v',2,'contentVersion','sound-seekers-v2','reset',jsonb_build_object('epoch',0,'at',0),
    'trail',jsonb_build_object('routeCursor',1,'journeyStep',1),
    'contentDecks',merged,'attemptReceipts','{}'::jsonb,
    'evidence','[]'::jsonb,'settings',jsonb_build_object('audio',false)
  );
  state_b := state_a || jsonb_build_object('contentDecks',alt_decks,
    'attemptReceipts',receipts,'evidence',jsonb_build_array(alt_event));
  state_c := state_a || jsonb_build_object('contentDecks',story_decks,
    'attemptReceipts',jsonb_build_object(story_receipt ->> 'attemptId',story_receipt),
    'evidence',jsonb_build_array(story_event));
  if public.lp_quest_merge_learning_v2(
       public.lp_quest_merge_learning_v2(state_a,state_b),state_c
     ) <> public.lp_quest_merge_learning_v2(
       state_a,public.lp_quest_merge_learning_v2(state_b,state_c)
     ) then
    raise exception 'A/B/C content merge depended on grouping';
  end if;
  if public.lp_quest_merge_learning_v2(state_a,state_a) #>> '{settings,audio}' <> 'false'
    or public.lp_forward_merge_progress('daily_mission','{"done":true}','{"done":false}')
      <> '{"done":false}'::jsonb then
    raise exception 'foundation settings or area merge boundary changed';
  end if;
end;
$$;

do $$
declare
  subject_id text := 'unknown-duplicate-ordinal';
  attempt_a0 text := 'content-placement-attempt:a:unknown-duplicate-ordinal:0:0';
  attempt_b0 text := 'content-placement-attempt:b:unknown-duplicate-ordinal:0:0';
  attempt_a1 text := 'content-placement-attempt:a:unknown-duplicate-ordinal:1:0';
  event_a0 jsonb;
  event_b0 jsonb;
  event_a1 jsonb;
  receipts jsonb;
  projected jsonb;
begin
  event_a0 := jsonb_build_object('id',attempt_a0 || ':0','at',1,
    'evidenceKind','practice','correct',true,'supportLevel',0,'revealed',false);
  event_b0 := jsonb_build_object('id',attempt_b0 || ':0','at',2,
    'evidenceKind','practice','correct',true,'supportLevel',0,'revealed',false);
  event_a1 := jsonb_build_object('id',attempt_a1 || ':0','at',3,
    'evidenceKind','practice','correct',true,'supportLevel',0,'revealed',false);
  receipts := jsonb_build_object(
    attempt_a0,jsonb_build_object(
      'kind','attempt_receipt','attemptId',attempt_a0,'operation','content_placement',
      'subjectId',subject_id,'decisionOrdinal',0,'attemptOrdinal',0,
      'inputSha256',repeat('a',64),'completed',false,'correctionRecordIds','[]'::jsonb,
      'eventIds',jsonb_build_array(event_a0 ->> 'id'),'useIds','[]'::jsonb),
    attempt_b0,jsonb_build_object(
      'kind','attempt_receipt','attemptId',attempt_b0,'operation','content_placement',
      'subjectId',subject_id,'decisionOrdinal',0,'attemptOrdinal',0,
      'inputSha256',repeat('b',64),'completed',false,'correctionRecordIds','[]'::jsonb,
      'eventIds',jsonb_build_array(event_b0 ->> 'id'),'useIds','[]'::jsonb),
    attempt_a1,jsonb_build_object(
      'kind','attempt_receipt','attemptId',attempt_a1,'operation','content_placement',
      'subjectId',subject_id,'decisionOrdinal',1,'attemptOrdinal',0,
      'inputSha256',repeat('c',64),'completed',false,'correctionRecordIds','[]'::jsonb,
      'eventIds',jsonb_build_array(event_a1 ->> 'id'),'useIds','[]'::jsonb)
  );
  receipts := public.lp_quest_union_v2_attempt_receipts(receipts,'{}'::jsonb);
  projected := public.lp_quest_valid_v2_attempt_receipts(
    jsonb_build_array(event_a0,event_b0,event_a1),'{}'::jsonb,receipts
  );
  if projected <> '{}'::jsonb then
    raise exception 'duplicate ordinal claim did not invalidate both claimants and tail';
  end if;
end;
$$;

do $$
declare
  normalized jsonb;
  numbered_input jsonb;
  numbered_expected jsonb;
  visit_value jsonb := jsonb_build_object(
    'kind','visit','visitId','whitespace-visit',
    'contentInstanceId',E'\talternative-instance\n',
    'visitOwnerId',' owner ','ownerActionUseId','action',
    'category','alternatives','slotId','slot','recordId','record','contentId','content',
    'targetId',null,'wordId',null,'stopId','s16','journeyStep',16
  );
  use_value jsonb := jsonb_build_object(
    'kind','use','useId','canonical-order-use','visitId','whitespace-visit',
    'contentInstanceId','alternative-instance','visitOwnerId','owner','actionUseId','action',
    'category','alternatives','slotId','slot','recordId','record','journeyStep',16,
    'attemptReceiptIds',jsonb_build_array(
      'content-placement-attempt:ä:subject:0:0',
      'content-placement-attempt:c:subject:0:0',
      'content-placement-attempt:b',
      'content-placement-attempt:a:subject:1:0'
    )
  );
begin
  if jsonb_array_length(public.lp_quest_union_v2_evidence(jsonb_build_array(
      jsonb_build_object('id','normalized-duplicate','at',1,
        'domain','connected_text_transfer'),
      jsonb_build_object('id','normalized-duplicate','at',1,
        'domain','connected_text_transfer','activityType','encoding')
    ),'[]'::jsonb)) <> 1
    or public.lp_quest_union_v2_evidence(jsonb_build_array(
      jsonb_build_object('id','heart-normalized-duplicate','at',1,
        'domain','heart_word_mapping','activityType','recognition'),
      jsonb_build_object('id','heart-normalized-duplicate','at',1,
        'domain','heart_word_mapping','activityType',E'\trecognition\n')
    ),'[]'::jsonb) #>> '{0,activityType}' <> 'recognition' then
    raise exception 'activity normalization did not precede evidence dedupe';
  end if;
  if public.lp_quest_union_v2_evidence(jsonb_build_array(
      jsonb_build_object('id','event:z','at',1),
      jsonb_build_object('id','event:ä','at',1),
      jsonb_build_object('id','event:Z','at',1),
      jsonb_build_object('id','event:a','at',1)
    ),'[]'::jsonb) <> jsonb_build_array(
      jsonb_build_object('id','event:Z','at',1),
      jsonb_build_object('id','event:a','at',1),
      jsonb_build_object('id','event:z','at',1),
      jsonb_build_object('id','event:ä','at',1)
    ) then
    raise exception 'equal-time evidence did not use deterministic C ordering';
  end if;
  if (select jsonb_agg(item -> 'at') from jsonb_array_elements(
      public.lp_quest_union_v2_evidence(jsonb_build_array(
        jsonb_build_object('id','string-time-0','at','z'),
        jsonb_build_object('id','string-time-1','at','ä'),
        jsonb_build_object('id','string-time-2','at','Z'),
        jsonb_build_object('id','string-time-3','at','a')
      ),'[]'::jsonb)
    ) item) <> jsonb_build_array('Z','a','z','ä') then
    raise exception 'string-time evidence did not use deterministic C ordering';
  end if;
  if btrim('visit:v', E' \t\n\r\f\013') <> 'visit:v'
    or btrim(E'\013visit:v\013', E' \t\n\r\f\013') <> 'visit:v' then
    raise exception 'canonical whitespace set corrupts letter v or misses vertical tab';
  end if;
  select jsonb_agg(to_jsonb(format('story-transfer-attempt:story:%s',n)) order by n desc),
         jsonb_agg(to_jsonb(format('story-transfer-attempt:story:%s',n)) order by n)
    into numbered_input,numbered_expected
    from generate_series(0,11) n;
  if public.lp_quest_normalize_v2_activity_type(
      'heart_word_mapping',E'\trecognition\n'
    ) <> 'recognition' then
    raise exception 'activity whitespace policy diverged';
  end if;
  normalized := public.lp_quest_normalize_v2_deck_visit(
    'alternatives','whitespace-visit',visit_value
  );
  if normalized ->> 'contentInstanceId' <> 'alternative-instance'
    or normalized ->> 'visitOwnerId' <> 'owner' then
    raise exception 'payload whitespace policy diverged';
  end if;
  normalized := public.lp_quest_normalize_v2_deck_visit(
    'alternatives','whitespace-visit',visit_value || jsonb_build_object('journeyStep',16.0)
  );
  if normalized -> 'journeyStep' <> to_jsonb(16::numeric) then
    raise exception 'integral decimal journey step did not canonicalize';
  end if;
  if public.lp_quest_normalize_v2_deck_visit(
      'alternatives','whitespace-visit',visit_value || jsonb_build_object(
        'journeyStep',9007199254740992::numeric
      )
    ) <> '{"kind":"visit_conflict","visitId":"whitespace-visit"}'::jsonb then
    raise exception 'unsafe journey step was accepted';
  end if;
  normalized := public.lp_quest_normalize_v2_deck_use(
    'alternatives','canonical-order-use',use_value
  );
  if normalized -> 'attemptReceiptIds' <> jsonb_build_array(
      'content-placement-attempt:c:subject:0:0',
      'content-placement-attempt:ä:subject:0:0',
      'content-placement-attempt:a:subject:1:0',
      'content-placement-attempt:b'
    ) then
    raise exception 'identifier order is not deterministic C collation';
  end if;
  normalized := public.lp_quest_normalize_v2_attempt_receipt(
    'content-placement-attempt:visit:decimal:subject:0:0',jsonb_build_object(
      'kind','attempt_receipt',
      'attemptId','content-placement-attempt:visit:decimal:subject:0:0',
      'operation','content_placement','subjectId','subject',
      'decisionOrdinal',0.0,'attemptOrdinal',0.0,'inputSha256',repeat('d',64),
      'completed',false,'correctionRecordIds','[]'::jsonb,
      'eventIds','[]'::jsonb,'useIds','[]'::jsonb
    )
  );
  if normalized -> 'decisionOrdinal' <> to_jsonb(0::numeric)
    or normalized -> 'attemptOrdinal' <> to_jsonb(0::numeric) then
    raise exception 'integral decimal receipt ordinals did not canonicalize';
  end if;
  normalized := public.lp_quest_normalize_v2_deck_use(
    'stories','blank-token-use',jsonb_build_object(
      'kind','use','useId','blank-token-use','visitId','blank-token-visit',
      'contentInstanceId','story-instance','visitOwnerId','story-owner',
      'actionUseId','story-action','category','stories','slotId','story-slot',
      'recordId','story-record','journeyStep',1,
      'attemptReceiptIds',jsonb_build_array('story-transfer-attempt:story:0'),
      'transactionId','story','pairedUseId','pair','evidenceEventId','event',
      'narrativeChoiceToken',E'\t\n'
    )
  );
  if normalized <> '{"kind":"use_conflict","useId":"blank-token-use"}'::jsonb then
    raise exception 'blank narrative token was accepted';
  end if;
  normalized := public.lp_quest_normalize_v2_deck_use(
    'stories','numbered-attempt-use',jsonb_build_object(
      'kind','use','useId','numbered-attempt-use','visitId','numbered-attempt-visit',
      'contentInstanceId','story-instance','visitOwnerId','story-owner',
      'actionUseId','story-action','category','stories','slotId','story-slot',
      'recordId','story-record','journeyStep',1,'attemptReceiptIds',numbered_input,
      'transactionId','story','pairedUseId','pair','evidenceEventId','event',
      'narrativeChoiceToken',null
    )
  );
  if normalized -> 'attemptReceiptIds' <> numbered_expected then
    raise exception 'numeric attempt order broke after attempt 9';
  end if;
end;
$$;

do $$
declare
  canonical_id text := 'outer-key-id';
  whitespace text;
  visit_value jsonb := jsonb_build_object(
    'kind','visit','visitId','outer-key-id',
    'contentInstanceId','alternatives-content-instance:outer-key',
    'visitOwnerId','outer-owner','ownerActionUseId','outer-owner:content-use',
    'category','alternatives','slotId','outer-slot','recordId','alternative:outer',
    'contentId','alternative:outer','targetId',null,'wordId',null,
    'stopId','s16','journeyStep',16
  );
  use_value jsonb := jsonb_build_object(
    'kind','use','useId','outer-key-id','visitId','outer-visit',
    'contentInstanceId','alternatives-content-instance:outer-key',
    'visitOwnerId','outer-owner','actionUseId','outer-owner:content-use',
    'category','alternatives','slotId','outer-slot','recordId','alternative:outer',
    'journeyStep',16,'attemptReceiptIds',jsonb_build_array(
      'content-placement-attempt:outer-visit:s16-alternative:0:0'
    )
  );
  receipt_value jsonb := jsonb_build_object(
    'kind','attempt_receipt','attemptId','outer-key-id','operation','content_placement',
    'subjectId','s16-alternative','decisionOrdinal',0,'attemptOrdinal',0,
    'inputSha256',repeat('a',64),'completed',false,
    'correctionRecordIds','[]'::jsonb,'eventIds','[]'::jsonb,'useIds','[]'::jsonb
  );
begin
  foreach whitespace in array array[' ', E'\t', E'\n'] loop
    if public.lp_quest_normalize_v2_deck_visit(
        'alternatives',whitespace || canonical_id || whitespace,visit_value
      ) is not null
      or public.lp_quest_normalize_v2_deck_use(
        'alternatives',whitespace || canonical_id || whitespace,use_value
      ) is not null
      or public.lp_quest_normalize_v2_attempt_receipt(
        whitespace || canonical_id || whitespace,receipt_value
      ) is not null then
      raise exception 'noncanonical whitespace outer ledger key was accepted';
    end if;
  end loop;
end;
$$;

do $$
declare
  attempt_id text := 'content-placement-attempt:visit:kind-check:s28-alternative:0:0';
  base_receipt jsonb := jsonb_build_object(
    'kind','attempt_receipt','attemptId',attempt_id,'operation','content_placement',
    'subjectId','s28-alternative','decisionOrdinal',0,'attemptOrdinal',0,
    'inputSha256',repeat('a',64),'completed',false,
    'correctionRecordIds','[]'::jsonb,'eventIds','[]'::jsonb,'useIds','[]'::jsonb
  );
  candidate jsonb;
  normalized jsonb;
begin
  foreach candidate in array array[
    base_receipt - 'kind',
    base_receipt || jsonb_build_object('kind','other'),
    base_receipt || jsonb_build_object('kind',7),
    base_receipt || jsonb_build_object('kind',true),
    base_receipt || jsonb_build_object('kind',jsonb_build_object('forged',true))
  ] loop
    normalized := public.lp_quest_normalize_v2_attempt_receipt(attempt_id,candidate);
    if normalized <> jsonb_build_object(
      'kind','attempt_receipt_conflict','attemptId',attempt_id
    ) then
      raise exception 'missing/arbitrary/non-string receipt kind was promoted';
    end if;
  end loop;
end;
$$;

-- Final merge-algebra, receipt-ownership, sequence, and foundation regressions.
do $$
declare
  heart_visit jsonb;
  heart_use jsonb;
  story_visit jsonb;
  transfer_visit jsonb;
  alt_visit jsonb;
  alt_use jsonb;
  alt_event jsonb;
  alt_receipt jsonb;
  morphology_visit jsonb;
  morphology_use jsonb;
  morphology_receipt jsonb;
  decks_a jsonb;
  decks_b jsonb;
  decks_c jsonb;
  state_base jsonb;
  state_a jsonb;
  state_b jsonb;
  state_c jsonb;
  merged_ab jsonb;
  merged_ba jsonb;
  grouped_left jsonb;
  grouped_right jsonb;
  left_value jsonb;
  right_value jsonb;
  conflict_left jsonb;
  conflict_right jsonb;
  conflict_group_left jsonb;
  conflict_group_right jsonb;
  expected_conflict jsonb;
  shared_event jsonb;
  duplicate_event_receipt_a jsonb;
  duplicate_event_receipt_b jsonb;
  duplicate_use_event_a jsonb;
  duplicate_use_event_b jsonb;
  duplicate_use_receipt_a jsonb;
  duplicate_use_receipt_b jsonb;
  receipt_decks jsonb;
  projected jsonb;
  gap_event jsonb;
  gap_receipt jsonb;
  duplicate_ordinal_event_a jsonb;
  duplicate_ordinal_event_b jsonb;
  duplicate_ordinal_receipt_a jsonb;
  duplicate_ordinal_receipt_b jsonb;
  mismatch_event jsonb;
  mismatch_receipt jsonb;
  closed_event jsonb;
  closed_receipt jsonb;
  after_closed_event jsonb;
  after_closed_receipt jsonb;
  s16_nonfinal_event jsonb;
  s16_nonfinal_receipt jsonb;
  oversized_event jsonb;
  oversized_receipt jsonb;
begin
  heart_visit := jsonb_build_object(
    'kind','visit','visitId','regroup-heart-visit',
    'contentInstanceId','heart-content-instance:regroup',
    'visitOwnerId','regroup-heart-owner','ownerActionUseId','regroup-heart-owner:content-use',
    'category','heartWords','slotId','heart-slot-regroup','recordId','hw:a',
    'contentId','heart-word:a','targetId','hw:a','wordId','a','stopId','s1',
    'journeyStep',1,'ownerActivityType','recognition'
  );
  heart_use := jsonb_build_object(
    'kind','use','useId','regroup-heart-use','visitId','regroup-heart-visit',
    'contentInstanceId','heart-content-instance:regroup',
    'visitOwnerId','regroup-heart-owner','actionUseId','regroup-heart-owner:content-use',
    'category','heartWords','slotId','heart-slot-regroup','recordId','hw:a',
    'journeyStep',1,'activityType','recognition'
  );
  story_visit := jsonb_build_object(
    'kind','visit','visitId','regroup-story-visit',
    'contentInstanceId','stories-content-instance:regroup',
    'visitOwnerId','s1-story','ownerActionUseId','s1-story:content-use',
    'category','stories','slotId','story-slot-s1','recordId','story:scene-s1',
    'contentId','scene-s1','targetId','text:scene-s1','wordId',null,'stopId','s1',
    'journeyStep',1
  );
  transfer_visit := jsonb_build_object(
    'kind','visit','visitId','regroup-transfer-visit',
    'contentInstanceId','transfer-content-instance:regroup',
    'visitOwnerId','s1-transfer','ownerActionUseId','s1-transfer:content-use',
    'category','transfer','slotId','transfer-slot-s1','recordId','transfer:s1',
    'contentId','transfer:s1','targetId','text:scene-s1','wordId',null,'stopId','s1',
    'journeyStep',1
  );
  alt_visit := jsonb_build_object(
    'kind','visit','visitId','regroup-alt-visit',
    'contentInstanceId','alternatives-content-instance:alternative-slot-s28',
    'visitOwnerId','s28-alternative','ownerActionUseId','s28-alternative:content-use',
    'category','alternatives','slotId','alternative-slot-s28','recordId','alternative:s28',
    'contentId','alternative:s28','targetId',null,'wordId',null,'stopId','s28',
    'journeyStep',28
  );
  alt_event := jsonb_build_object(
    'id','content-placement-attempt:regroup-alt-visit:s28-alternative:0:0:0',
    'at','2026-09-02T04:00:00.000Z','evidenceKind','practice',
    'domain','grapheme_to_phoneme','correct',true,'supportLevel',0,'revealed',false
  );
  alt_use := jsonb_build_object(
    'kind','use','useId','regroup-alt-use','visitId','regroup-alt-visit',
    'contentInstanceId','alternatives-content-instance:alternative-slot-s28',
    'visitOwnerId','s28-alternative','actionUseId','s28-alternative:content-use',
    'category','alternatives','slotId','alternative-slot-s28','recordId','alternative:s28',
    'journeyStep',28,'attemptReceiptIds',jsonb_build_array(
      'content-placement-attempt:regroup-alt-visit:s28-alternative:0:0'
    )
  );
  alt_receipt := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:regroup-alt-visit:s28-alternative:0:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('a',64),
    'completed',true,'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(alt_event ->> 'id'),
    'useIds',jsonb_build_array('regroup-alt-use')
  );
  morphology_visit := jsonb_build_object(
    'kind','visit','visitId','regroup-morphology-visit',
    'contentInstanceId','morphology-content-instance:morphology-slot-s38',
    'visitOwnerId','s38-morphology','ownerActionUseId','s38-morphology:content-use',
    'category','morphology','slotId','morphology-slot-s38',
    'recordId','morphology:s38:suffix_s','contentId','morphology:suffix_s:cats',
    'targetId',null,'wordId','cats','stopId','s38','journeyStep',38
  );
  morphology_use := jsonb_build_object(
    'kind','use','useId','regroup-morphology-use','visitId','regroup-morphology-visit',
    'contentInstanceId','morphology-content-instance:morphology-slot-s38',
    'visitOwnerId','s38-morphology','actionUseId','s38-morphology:content-use',
    'category','morphology','slotId','morphology-slot-s38',
    'recordId','morphology:s38:suffix_s','journeyStep',38,
    'attemptReceiptIds',jsonb_build_array(
      'content-placement-attempt:regroup-morphology-visit:s38-morphology:0:0'
    )
  );
  morphology_receipt := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:regroup-morphology-visit:s38-morphology:0:0',
    'operation','content_placement','subjectId','s38-morphology',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('b',64),
    'completed',true,'correctionRecordIds','[]'::jsonb,'eventIds','[]'::jsonb,
    'useIds',jsonb_build_array('regroup-morphology-use')
  );

  decks_a := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'heartWords',jsonb_build_object(
      'visits',jsonb_build_object('regroup-heart-visit',heart_visit),
      'uses',jsonb_build_object('regroup-heart-use',heart_use)
    ),
    'stories',jsonb_build_object(
      'visits',jsonb_build_object('regroup-story-visit',story_visit),'uses','{}'::jsonb
    )
  ), '{}');
  decks_b := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'alternatives',jsonb_build_object(
      'visits',jsonb_build_object('regroup-alt-visit',alt_visit),
      'uses',jsonb_build_object('regroup-alt-use',alt_use)
    ),
    'transfer',jsonb_build_object(
      'visits',jsonb_build_object('regroup-transfer-visit',transfer_visit),'uses','{}'::jsonb
    )
  ), '{}');
  decks_c := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'morphology',jsonb_build_object(
      'visits',jsonb_build_object('regroup-morphology-visit',morphology_visit),
      'uses',jsonb_build_object('regroup-morphology-use',morphology_use)
    )
  ), '{}');
  state_base := jsonb_build_object(
    'v',2,'contentVersion','sound-seekers-v2',
    'reset',jsonb_build_object('epoch',4,'at','2026-09-02T04:00:00.000Z'),
    'trail',jsonb_build_object(
      'routeCursor',1,'journeyStep',40,'completedStopIds',jsonb_build_array('s1'),
      'repairs',jsonb_build_object('bridge',true),
      'chapterCoverage',jsonb_build_object('chapter-1',true)
    ),
    'journal',jsonb_build_object(
      'words',jsonb_build_array('word-a'),'scenes',jsonb_build_array('scene-s1'),
      'stickers',jsonb_build_array('sticker-a')
    ),
    'rewards',jsonb_build_object('claimedIds',jsonb_build_array('reward-a')),
    'assignment',jsonb_build_object(
      'stopIds',jsonb_build_array('s1','s2'),'targets',jsonb_build_array('target-a'),
      'note','Keep this assignment','assignedAt','2026-09-02T04:00:00.000Z','by','teacher'
    ),
    'settings',jsonb_build_object('audio',false,'reducedMotion',true),
    'checkpoint','null'::jsonb
  );
  state_a := state_base || jsonb_build_object(
    'contentDecks',decks_a,'attemptReceipts','{}'::jsonb,'evidence','[]'::jsonb
  );
  state_b := state_base || jsonb_build_object(
    'contentDecks',decks_b,
    'attemptReceipts',jsonb_build_object(alt_receipt ->> 'attemptId',alt_receipt),
    'evidence',jsonb_build_array(alt_event)
  );
  state_c := state_base || jsonb_build_object(
    'contentDecks',decks_c,
    'attemptReceipts',jsonb_build_object(
      morphology_receipt ->> 'attemptId',morphology_receipt
    ),'evidence','[]'::jsonb
  );
  merged_ab := public.lp_quest_merge_learning_v2(state_a,state_b);
  merged_ba := public.lp_quest_merge_learning_v2(state_b,state_a);
  grouped_left := public.lp_quest_merge_learning_v2(merged_ab,state_c);
  grouped_right := public.lp_quest_merge_learning_v2(
    state_a,public.lp_quest_merge_learning_v2(state_b,state_c)
  );
  if merged_ab <> merged_ba or grouped_left <> grouped_right
    or grouped_left #> '{contentDecks,heartWords,visits,regroup-heart-visit}' is null
    or grouped_left #> '{contentDecks,stories,visits,regroup-story-visit}' is null
    or grouped_left #> '{contentDecks,alternatives,uses,regroup-alt-use}' is null
    or grouped_left #> '{contentDecks,morphology,uses,regroup-morphology-use}' is null
    or grouped_left #> '{contentDecks,transfer,visits,regroup-transfer-visit}' is null
    or (select count(*) from jsonb_object_keys(grouped_left -> 'attemptReceipts')) <> 2
    or jsonb_array_length(grouped_left -> 'evidence') <> 1 then
    raise exception 'whole-state reverse or A/B/C regrouping omitted a deck/evidence/receipt ledger';
  end if;
  if grouped_left -> 'reset' <> state_base -> 'reset'
    or grouped_left -> 'assignment' <> state_base -> 'assignment'
    or grouped_left -> 'journal' <> state_base -> 'journal'
    or grouped_left -> 'rewards' <> state_base -> 'rewards' then
    raise exception 'foundation assignment/reset/journal/reward behavior changed';
  end if;

  left_value := jsonb_build_object('regroup-alt-use',alt_use);
  right_value := jsonb_build_object(
    'regroup-alt-use',alt_use || jsonb_build_object('recordId','alternative:divergent')
  );
  conflict_left := public.lp_quest_union_v2_deck_uses(
    'alternatives',left_value,right_value
  );
  conflict_right := public.lp_quest_union_v2_deck_uses(
    'alternatives',right_value,left_value
  );
  conflict_group_left := public.lp_quest_union_v2_deck_uses(
    'alternatives',conflict_left,left_value
  );
  conflict_group_right := public.lp_quest_union_v2_deck_uses(
    'alternatives',left_value,public.lp_quest_union_v2_deck_uses(
      'alternatives',right_value,left_value
    )
  );
  expected_conflict := jsonb_build_object(
    'regroup-alt-use',jsonb_build_object('kind','use_conflict','useId','regroup-alt-use')
  );
  if conflict_left <> expected_conflict or conflict_right <> expected_conflict
    or conflict_group_left <> expected_conflict
    or conflict_group_right <> expected_conflict then
    raise exception 'same-ID divergent use conflict was not reverse/associative/absorbing';
  end if;

  left_value := jsonb_build_array(alt_event);
  right_value := jsonb_build_array(alt_event || jsonb_build_object(
    'at','2026-09-02T04:00:01.000Z','correct',false
  ));
  conflict_left := public.lp_quest_union_v2_evidence(left_value,right_value);
  conflict_right := public.lp_quest_union_v2_evidence(right_value,left_value);
  conflict_group_left := public.lp_quest_union_v2_evidence(conflict_left,left_value);
  conflict_group_right := public.lp_quest_union_v2_evidence(
    left_value,public.lp_quest_union_v2_evidence(right_value,left_value)
  );
  expected_conflict := jsonb_build_array(jsonb_build_object(
    'id',alt_event ->> 'id','at','2026-09-02T04:00:01.000Z',
    'evidenceKind','conflict','conflicted',true
  ));
  if conflict_left <> expected_conflict or conflict_right <> expected_conflict
    or conflict_group_left <> expected_conflict
    or conflict_group_right <> expected_conflict then
    raise exception 'same-ID divergent evidence conflict was not reverse/associative/absorbing';
  end if;

  receipt_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'alternatives',jsonb_build_object(
      'visits',jsonb_build_object('regroup-alt-visit',alt_visit),
      'uses',jsonb_build_object('regroup-alt-use',alt_use)
    )
  ), '{}');
  shared_event := jsonb_build_object(
    'id','content-placement-attempt:duplicate-event-a:s28-alternative:0:0:0',
    'at','2026-09-02T04:01:00.000Z','evidenceKind','practice','correct',false,
    'supportLevel',0,'revealed',false
  );
  duplicate_event_receipt_a := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:duplicate-event-a:s28-alternative:0:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('1',64),
    'completed',false,
    'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:duplicate-event-a:s28-alternative:0:0'
    ),'eventIds',jsonb_build_array(shared_event ->> 'id'),'useIds','[]'::jsonb
  );
  duplicate_event_receipt_b := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:duplicate-event-b:s29-alternative:0:0',
    'operation','content_placement','subjectId','s29-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('2',64),
    'completed',false,
    'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:duplicate-event-b:s29-alternative:0:0'
    ),'eventIds',jsonb_build_array(shared_event ->> 'id'),'useIds','[]'::jsonb
  );
  projected := public.lp_quest_valid_v2_attempt_receipts(
    jsonb_build_array(shared_event),receipt_decks,jsonb_build_object(
      duplicate_event_receipt_a ->> 'attemptId',duplicate_event_receipt_a,
      duplicate_event_receipt_b ->> 'attemptId',duplicate_event_receipt_b
    )
  );
  if projected <> '{}'::jsonb then
    raise exception 'duplicate event receipt ownership was accepted';
  end if;

  duplicate_use_event_a := jsonb_build_object(
    'id','content-placement-attempt:duplicate-use-a:s28-alternative:0:0:0',
    'at','2026-09-02T04:01:01.000Z','evidenceKind','practice','correct',true,
    'supportLevel',0,'revealed',false
  );
  duplicate_use_event_b := jsonb_build_object(
    'id','content-placement-attempt:duplicate-use-b:s29-alternative:0:0:0',
    'at','2026-09-02T04:01:02.000Z','evidenceKind','practice','correct',true,
    'supportLevel',0,'revealed',false
  );
  duplicate_use_receipt_a := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:duplicate-use-a:s28-alternative:0:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('3',64),
    'completed',true,'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(duplicate_use_event_a ->> 'id'),
    'useIds',jsonb_build_array('regroup-alt-use')
  );
  duplicate_use_receipt_b := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:duplicate-use-b:s29-alternative:0:0',
    'operation','content_placement','subjectId','s29-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('4',64),
    'completed',true,'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(duplicate_use_event_b ->> 'id'),
    'useIds',jsonb_build_array('regroup-alt-use')
  );
  projected := public.lp_quest_valid_v2_attempt_receipts(
    jsonb_build_array(duplicate_use_event_a,duplicate_use_event_b),receipt_decks,
    jsonb_build_object(
      duplicate_use_receipt_a ->> 'attemptId',duplicate_use_receipt_a,
      duplicate_use_receipt_b ->> 'attemptId',duplicate_use_receipt_b
    )
  );
  if projected <> '{}'::jsonb then
    raise exception 'duplicate use receipt ownership was accepted';
  end if;

  gap_event := jsonb_build_object(
    'id','content-placement-attempt:gap:s28-alternative:0:1:0',
    'at','2026-09-02T04:02:00.000Z','evidenceKind','practice','correct',false,
    'supportLevel',1,'revealed',false
  );
  gap_receipt := jsonb_build_object(
    'kind','attempt_receipt','attemptId','content-placement-attempt:gap:s28-alternative:0:1',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',1,'inputSha256',repeat('5',64),
    'completed',false,
    'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:gap:s28-alternative:0:1'
    ),'eventIds',jsonb_build_array(gap_event ->> 'id'),'useIds','[]'::jsonb
  );
  if public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(gap_event),receipt_decks,
      jsonb_build_object(gap_receipt ->> 'attemptId',gap_receipt)
    ) ? (gap_receipt ->> 'attemptId') then
    raise exception 'ordinal gap was accepted';
  end if;

  duplicate_ordinal_event_a := jsonb_build_object(
    'id','content-placement-attempt:duplicate-ordinal-a:s28-alternative:0:0:0',
    'at','2026-09-02T04:02:01.000Z','evidenceKind','practice','correct',false,
    'supportLevel',0,'revealed',false
  );
  duplicate_ordinal_event_b := duplicate_ordinal_event_a || jsonb_build_object(
    'id','content-placement-attempt:duplicate-ordinal-b:s28-alternative:0:0:0',
    'at','2026-09-02T04:02:02.000Z'
  );
  duplicate_ordinal_receipt_a := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:duplicate-ordinal-a:s28-alternative:0:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('6',64),
    'completed',false,'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:duplicate-ordinal-a:s28-alternative:0:0'
    ),'eventIds',jsonb_build_array(duplicate_ordinal_event_a ->> 'id'),'useIds','[]'::jsonb
  );
  duplicate_ordinal_receipt_b := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:duplicate-ordinal-b:s28-alternative:0:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('7',64),
    'completed',false,'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:duplicate-ordinal-b:s28-alternative:0:0'
    ),'eventIds',jsonb_build_array(duplicate_ordinal_event_b ->> 'id'),'useIds','[]'::jsonb
  );
  projected := public.lp_quest_valid_v2_attempt_receipts(
    jsonb_build_array(duplicate_ordinal_event_a,duplicate_ordinal_event_b),receipt_decks,
    jsonb_build_object(
      duplicate_ordinal_receipt_a ->> 'attemptId',duplicate_ordinal_receipt_a,
      duplicate_ordinal_receipt_b ->> 'attemptId',duplicate_ordinal_receipt_b
    )
  );
  if (select count(*) from jsonb_object_keys(projected)) = 2 then
    raise exception 'duplicate ordinal receipts were both accepted';
  end if;

  mismatch_event := jsonb_build_object(
    'id','content-placement-attempt:support-mismatch:s28-alternative:0:0:0',
    'at','2026-09-02T04:03:00.000Z','evidenceKind','practice','correct',false,
    'supportLevel',1,'revealed',false
  );
  mismatch_receipt := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:support-mismatch:s28-alternative:0:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('8',64),
    'completed',false,'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:support-mismatch:s28-alternative:0:0'
    ),'eventIds',jsonb_build_array(mismatch_event ->> 'id'),'useIds','[]'::jsonb
  );
  if public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(mismatch_event),receipt_decks,
      jsonb_build_object(mismatch_receipt ->> 'attemptId',mismatch_receipt)
    ) ? (mismatch_receipt ->> 'attemptId') then
    raise exception 'support mismatch was accepted';
  end if;
  mismatch_event := mismatch_event || jsonb_build_object(
    'id','content-placement-attempt:reveal-mismatch:s28-alternative:0:0:0',
    'supportLevel',0,'revealed',true
  );
  mismatch_receipt := mismatch_receipt || jsonb_build_object(
    'attemptId','content-placement-attempt:reveal-mismatch:s28-alternative:0:0',
    'inputSha256',repeat('9',64),
    'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:reveal-mismatch:s28-alternative:0:0'
    ),'eventIds',jsonb_build_array(mismatch_event ->> 'id')
  );
  if public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(mismatch_event),receipt_decks,
      jsonb_build_object(mismatch_receipt ->> 'attemptId',mismatch_receipt)
    ) ? (mismatch_receipt ->> 'attemptId') then
    raise exception 'reveal mismatch was accepted';
  end if;

  closed_event := jsonb_build_object(
    'id','content-placement-attempt:closed:s28-alternative:0:0:0',
    'at','2026-09-02T04:04:00.000Z','evidenceKind','practice','correct',true,
    'supportLevel',0,'revealed',false
  );
  closed_receipt := jsonb_build_object(
    'kind','attempt_receipt','attemptId','content-placement-attempt:closed:s28-alternative:0:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('c',64),
    'completed',true,'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(closed_event ->> 'id'),
    'useIds',jsonb_build_array('regroup-alt-use')
  );
  after_closed_event := jsonb_build_object(
    'id','content-placement-attempt:closed:s28-alternative:0:1:0',
    'at','2026-09-02T04:04:01.000Z','evidenceKind','practice','correct',false,
    'supportLevel',1,'revealed',false
  );
  after_closed_receipt := jsonb_build_object(
    'kind','attempt_receipt','attemptId','content-placement-attempt:closed:s28-alternative:0:1',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',1,'inputSha256',repeat('d',64),
    'completed',false,'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:closed:s28-alternative:0:1'
    ),'eventIds',jsonb_build_array(after_closed_event ->> 'id'),'useIds','[]'::jsonb
  );
  projected := public.lp_quest_valid_v2_attempt_receipts(
    jsonb_build_array(closed_event,after_closed_event),receipt_decks,jsonb_build_object(
      closed_receipt ->> 'attemptId',closed_receipt,
      after_closed_receipt ->> 'attemptId',after_closed_receipt
    )
  );
  if not (projected ? (closed_receipt ->> 'attemptId'))
    or projected ? (after_closed_receipt ->> 'attemptId') then
    raise exception 'incorrect event after a closed decision was accepted';
  end if;

  s16_nonfinal_event := jsonb_build_object(
    'id','content-placement-attempt:s16-nonfinal:s16-alternative:0:0:0',
    'at','2026-09-02T04:05:00.000Z','evidenceKind','practice','correct',true,
    'supportLevel',0,'revealed',false
  );
  s16_nonfinal_receipt := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:s16-nonfinal:s16-alternative:0:0',
    'operation','content_placement','subjectId','s16-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('e',64),
    'completed',true,'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(s16_nonfinal_event ->> 'id'),
    'useIds',jsonb_build_array('regroup-alt-use')
  );
  if public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(s16_nonfinal_event),receipt_decks,
      jsonb_build_object(s16_nonfinal_receipt ->> 'attemptId',s16_nonfinal_receipt)
    ) ? (s16_nonfinal_receipt ->> 'attemptId') then
    raise exception 's16 non-final correct completed/use receipt was accepted';
  end if;

  mismatch_event := jsonb_build_object(
    'id','content-placement-attempt:garbage-correct:s28-alternative:0:0:0',
    'at','2026-09-02T04:06:00.000Z','evidenceKind','practice','correct','garbage',
    'supportLevel',0,'revealed',false
  );
  mismatch_receipt := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:garbage-correct:s28-alternative:0:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('1',64),
    'completed',false,'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:garbage-correct:s28-alternative:0:0'
    ),'eventIds',jsonb_build_array(mismatch_event ->> 'id'),'useIds','[]'::jsonb
  );
  if public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(mismatch_event),receipt_decks,
      jsonb_build_object(mismatch_receipt ->> 'attemptId',mismatch_receipt)
    ) ? (mismatch_receipt ->> 'attemptId') then
    raise exception 'garbage correct scalar was accepted';
  end if;

  mismatch_event := jsonb_build_object(
    'id','content-placement-attempt:garbage-conflicted:s28-alternative:0:0:0',
    'at','2026-09-02T04:06:01.000Z','evidenceKind','practice','conflicted','garbage',
    'correct',false,'supportLevel',0,'revealed',false
  );
  mismatch_receipt := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:garbage-conflicted:s28-alternative:0:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('2',64),
    'completed',false,'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:garbage-conflicted:s28-alternative:0:0'
    ),'eventIds',jsonb_build_array(mismatch_event ->> 'id'),'useIds','[]'::jsonb
  );
  if not (public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(mismatch_event),receipt_decks,
      jsonb_build_object(mismatch_receipt ->> 'attemptId',mismatch_receipt)
    ) ? (mismatch_receipt ->> 'attemptId')) then
    raise exception 'malformed conflicted scalar diverged from JS exact-true parity';
  end if;

  mismatch_event := jsonb_build_object(
    'id','content-placement-attempt:fractional-support:s28-alternative:0:0:0',
    'at','2026-09-02T04:06:02.000Z','evidenceKind','practice','correct',false,
    'supportLevel',0.5,'revealed',false
  );
  mismatch_receipt := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:fractional-support:s28-alternative:0:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('3',64),
    'completed',false,'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:fractional-support:s28-alternative:0:0'
    ),'eventIds',jsonb_build_array(mismatch_event ->> 'id'),'useIds','[]'::jsonb
  );
  if public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(mismatch_event),receipt_decks,
      jsonb_build_object(mismatch_receipt ->> 'attemptId',mismatch_receipt)
    ) ? (mismatch_receipt ->> 'attemptId') then
    raise exception 'fractional support was accepted';
  end if;

  oversized_event := jsonb_build_object(
    'id','content-placement-attempt:oversized-attempt:s28-alternative:0:999999999999999999999999999999:0',
    'at','2026-09-02T04:06:03.000Z','evidenceKind','practice','correct',false,
    'supportLevel',3,'revealed',true
  );
  oversized_receipt := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:oversized-attempt:s28-alternative:0:999999999999999999999999999999',
    'operation','content_placement','subjectId','s28-alternative','decisionOrdinal',0,
    'attemptOrdinal',999999999999999999999999999999::numeric,
    'inputSha256',repeat('4',64),'completed',false,
    'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:oversized-attempt:s28-alternative:0:999999999999999999999999999999'
    ),'eventIds',jsonb_build_array(oversized_event ->> 'id'),'useIds','[]'::jsonb
  );
  if public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(oversized_event),receipt_decks,
      jsonb_build_object(oversized_receipt ->> 'attemptId',oversized_receipt)
    ) ? (oversized_receipt ->> 'attemptId') then
    raise exception 'oversized attempt ordinal was accepted';
  end if;

  oversized_event := jsonb_build_object(
    'id','content-placement-attempt:oversized-decision:s28-alternative:999999999999999999999999999999:0:0',
    'at','2026-09-02T04:06:04.000Z','evidenceKind','practice','correct',false,
    'supportLevel',0,'revealed',false
  );
  oversized_receipt := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:oversized-decision:s28-alternative:999999999999999999999999999999:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',999999999999999999999999999999::numeric,'attemptOrdinal',0,
    'inputSha256',repeat('5',64),'completed',false,
    'correctionRecordIds',jsonb_build_array(
      'content-correction:content-placement-attempt:oversized-decision:s28-alternative:999999999999999999999999999999:0'
    ),'eventIds',jsonb_build_array(oversized_event ->> 'id'),'useIds','[]'::jsonb
  );
  if public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(oversized_event),receipt_decks,
      jsonb_build_object(oversized_receipt ->> 'attemptId',oversized_receipt)
    ) ? (oversized_receipt ->> 'attemptId') then
    raise exception 'oversized decision ordinal was accepted';
  end if;
end;
$$;

-- Full story correction history, reciprocal repair, boss tokens, and pair-parent checks.
do $$
declare
  story_visit jsonb;
  transfer_visit jsonb;
  story_use jsonb;
  transfer_use jsonb;
  story_decks jsonb;
  story_events jsonb := '[]'::jsonb;
  story_receipts jsonb := '{}'::jsonb;
  attempt_id text;
  attempt_number int;
  event_value jsonb;
  receipt_value jsonb;
  valid_receipts jsonb;
  valid_decks jsonb;
  partial_decks jsonb;
  repaired_decks jsonb;
  tampered_decks jsonb;
  tampered_transfer_visit jsonb;
  tampered_transfer_use jsonb;
  boss_story_visit jsonb;
  boss_transfer_visit jsonb;
  boss_story_use jsonb;
  boss_transfer_use jsonb;
  boss_event jsonb;
  boss_receipt jsonb;
  boss_decks jsonb;
  model_checkpoint jsonb;
  response_checkpoint jsonb;
  state_model jsonb;
  state_response jsonb;
  merged_state jsonb;
  normalized jsonb;
begin
  story_visit := jsonb_build_object(
    'kind','visit','visitId','story-ladder-visit',
    'contentInstanceId','stories-content-instance:story-slot-s2',
    'visitOwnerId','s2-story','ownerActionUseId','s2-story:content-use',
    'category','stories','slotId','story-slot-s2','recordId','story:scene-s2',
    'contentId','scene-s2','targetId','text:scene-s2','wordId',null,'stopId','s2',
    'journeyStep',2
  );
  transfer_visit := jsonb_build_object(
    'kind','visit','visitId','transfer-ladder-visit',
    'contentInstanceId','transfer-content-instance:transfer-slot-s2',
    'visitOwnerId','s2-transfer','ownerActionUseId','s2-transfer:content-use',
    'category','transfer','slotId','transfer-slot-s2','recordId','transfer:s2',
    'contentId','transfer:s2','targetId','text:scene-s2','wordId',null,'stopId','s2',
    'journeyStep',2
  );
  story_use := jsonb_build_object(
    'kind','use','useId','story-ladder-use','visitId','story-ladder-visit',
    'contentInstanceId','stories-content-instance:story-slot-s2',
    'visitOwnerId','s2-story','actionUseId','s2-story:content-use',
    'category','stories','slotId','story-slot-s2','recordId','story:scene-s2',
    'journeyStep',2,'transactionId','story-ladder:2:s2',
    'pairedUseId','transfer-ladder-use',
    'evidenceEventId','story-transfer-attempt:story-ladder:2:s2:3:0',
    'narrativeChoiceToken',null,
    'attemptReceiptIds',jsonb_build_array(
      'story-transfer-attempt:story-ladder:2:s2:0',
      'story-transfer-attempt:story-ladder:2:s2:1',
      'story-transfer-attempt:story-ladder:2:s2:2',
      'story-transfer-attempt:story-ladder:2:s2:3'
    )
  );
  transfer_use := jsonb_build_object(
    'kind','use','useId','transfer-ladder-use','visitId','transfer-ladder-visit',
    'contentInstanceId','transfer-content-instance:transfer-slot-s2',
    'visitOwnerId','s2-transfer','actionUseId','s2-transfer:content-use',
    'category','transfer','slotId','transfer-slot-s2','recordId','transfer:s2',
    'journeyStep',2,'transactionId','story-ladder:2:s2',
    'pairedUseId','story-ladder-use',
    'evidenceEventId','story-transfer-attempt:story-ladder:2:s2:3:0',
    'narrativeChoiceToken',null,
    'attemptReceiptIds',story_use -> 'attemptReceiptIds'
  );
  for attempt_number in 0..3 loop
    attempt_id := format('story-transfer-attempt:story-ladder:2:s2:%s',attempt_number);
    event_value := jsonb_build_object(
      'id',attempt_id || ':0','at',format('2026-09-02T02:00:0%s.000Z',attempt_number),
      'evidenceKind','practice','domain','connected_text_transfer',
      'targetId','text:scene-s2','word',null,'position',null,
      'connectedTextId','scene-s2','bossTransferId',null,
      'correct',attempt_number = 3,'supportLevel',least(attempt_number,3),
      'revealed',attempt_number >= 3
    );
    receipt_value := jsonb_build_object(
      'kind','attempt_receipt','attemptId',attempt_id,'operation','story_transfer',
      'subjectId','story-ladder:2:s2','decisionOrdinal',0,
      'attemptOrdinal',attempt_number,'inputSha256',repeat((attempt_number + 1)::text,64),
      'completed',attempt_number = 3,
      'correctionRecordIds',case when attempt_number < 3
        then jsonb_build_array('content-correction:' || attempt_id) else '[]'::jsonb end,
      'eventIds',jsonb_build_array(event_value ->> 'id'),
      'useIds',case when attempt_number = 3
        then jsonb_build_array('story-ladder-use','transfer-ladder-use') else '[]'::jsonb end
    );
    story_events := story_events || jsonb_build_array(event_value);
    story_receipts := story_receipts || jsonb_build_object(attempt_id,receipt_value);
  end loop;
  story_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'stories',jsonb_build_object(
      'visits',jsonb_build_object('story-ladder-visit',story_visit),
      'uses',jsonb_build_object('story-ladder-use',story_use)
    ),
    'transfer',jsonb_build_object(
      'visits',jsonb_build_object('transfer-ladder-visit',transfer_visit),
      'uses',jsonb_build_object('transfer-ladder-use',transfer_use)
    )
  ), '{}');
  valid_receipts := public.lp_quest_valid_v2_attempt_receipts(
    story_events,story_decks,story_receipts
  );
  valid_decks := public.lp_quest_valid_v2_content_decks(
    story_decks,story_receipts,story_events
  );
  if (select count(*) from jsonb_object_keys(valid_receipts)) <> 4
    or story_events #>> '{0,supportLevel}' <> '0'
    or story_events #>> '{1,supportLevel}' <> '1'
    or story_events #>> '{2,supportLevel}' <> '2'
    or story_events #>> '{3,supportLevel}' <> '3'
    or story_events #>> '{3,revealed}' <> 'true'
    or story_events #>> '{3,domain}' <> 'connected_text_transfer'
    or story_events #> '{3}' ? 'activityType'
    or valid_decks #> '{stories,uses,story-ladder-use}' is null
    or valid_decks #> '{transfer,uses,transfer-ladder-use}' is null
    or valid_decks #> '{stories,uses,story-ladder-use,narrativeChoiceToken}' <> 'null'::jsonb
    or valid_decks #> '{transfer,uses,transfer-ladder-use,narrativeChoiceToken}' <> 'null'::jsonb then
    raise exception 'full non-boss story ladder or null-token reciprocal pair failed';
  end if;

  model_checkpoint := jsonb_build_object(
    'contentVersion','sound-seekers-v2',
    'storyTransfer',jsonb_build_object(
      'kind','story_transfer','transactionId','story-ladder:2:s2','stopId','s2',
      'journeyStep',2,'stage','model_pending','storyVisitId','story-ladder-visit',
      'transferVisitId','transfer-ladder-visit','narrativeChoiceToken',null,
      'attemptOrdinal',3,'attemptId','story-transfer-attempt:story-ladder:2:s2:3'
    )
  );
  response_checkpoint := jsonb_set(
    model_checkpoint,'{storyTransfer,stage}','"response_pending"'::jsonb
  );
  state_model := jsonb_build_object(
    'v',2,'contentVersion','sound-seekers-v2','reset',jsonb_build_object('epoch',0,'at',0),
    'trail',jsonb_build_object('routeCursor',1,'journeyStep',2),
    'contentDecks',story_decks,'attemptReceipts',story_receipts,
    'evidence',story_events,'checkpoint',model_checkpoint
  );
  state_response := state_model || jsonb_build_object('checkpoint',response_checkpoint);
  merged_state := public.lp_quest_merge_learning_v2(state_model,state_response);
  if (model_checkpoint #> '{storyTransfer}') - 'stage'
      <> (response_checkpoint #> '{storyTransfer}') - 'stage'
    or model_checkpoint #>> '{storyTransfer,attemptId}'
      <> response_checkpoint #>> '{storyTransfer,attemptId}'
    or merged_state #> '{checkpoint}' <> response_checkpoint
    or merged_state #>> '{checkpoint,storyTransfer,stage}' <> 'response_pending' then
    raise exception 'story model_pending to response_pending incoming winner was not byte exact';
  end if;

  partial_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'stories',jsonb_build_object(
      'visits',jsonb_build_object('story-ladder-visit',story_visit),
      'uses',jsonb_build_object('story-ladder-use',story_use)
    ),
    'transfer',jsonb_build_object(
      'visits',jsonb_build_object('transfer-ladder-visit',transfer_visit),
      'uses','{}'::jsonb
    )
  ), '{}');
  if partial_decks #>> '{stories,uses,story-ladder-use,kind}' <> 'use'
    or public.lp_quest_valid_v2_content_decks(
      partial_decks,story_receipts,story_events
    ) #> '{stories,uses,story-ladder-use}' is not null then
    raise exception 'unpaired story half was not retained raw and rejected';
  end if;
  repaired_decks := public.lp_quest_merge_v2_content_decks(
    partial_decks,
    jsonb_build_object('transfer',jsonb_build_object(
      'visits','{}'::jsonb,
      'uses',jsonb_build_object('transfer-ladder-use',transfer_use)
    ))
  );
  if public.lp_quest_valid_v2_content_decks(
      repaired_decks,story_receipts,story_events
    ) #> '{stories,uses,story-ladder-use}' is null
    or public.lp_quest_valid_v2_content_decks(
      repaired_decks,story_receipts,story_events
    ) #> '{transfer,uses,transfer-ladder-use}' is null then
    raise exception 'exact missing reciprocal use did not restore both halves';
  end if;

  normalized := public.lp_quest_normalize_v2_deck_use(
    'stories','missing-narrative-use',(story_use || jsonb_build_object(
      'useId','missing-narrative-use'
    )) - 'narrativeChoiceToken'
  );
  if normalized <> '{"kind":"use_conflict","useId":"missing-narrative-use"}'::jsonb then
    raise exception 'missing narrative field did not become an exact raw conflict';
  end if;

  boss_story_visit := jsonb_build_object(
    'kind','visit','visitId','boss-story-visit',
    'contentInstanceId','stories-content-instance:story-slot-s5',
    'visitOwnerId','s5-story','ownerActionUseId','s5-story:content-use',
    'category','stories','slotId','story-slot-s5','recordId','story:scene-s5',
    'contentId','scene-s5','targetId','text:scene-s5','wordId',null,'stopId','s5',
    'journeyStep',5
  );
  boss_transfer_visit := jsonb_build_object(
    'kind','visit','visitId','boss-transfer-visit',
    'contentInstanceId','transfer-content-instance:transfer-slot-s5',
    'visitOwnerId','s5-transfer','ownerActionUseId','s5-transfer:content-use',
    'category','transfer','slotId','transfer-slot-s5','recordId','transfer:s5',
    'contentId','transfer:s5','targetId','boss-novel:s5:cat','wordId','cat','stopId','s5',
    'journeyStep',5
  );
  attempt_id := 'story-transfer-attempt:boss-route:5:s5:0';
  boss_event := jsonb_build_object(
    'id',attempt_id || ':0','at','2026-09-02T02:01:00.000Z',
    'evidenceKind','practice','domain','novel_decoding','targetId','boss-novel:s5:cat',
    'word','cat','position','whole','connectedTextId',null,'bossTransferId','boss-s5',
    'correct',true,'supportLevel',0,'revealed',false
  );
  boss_story_use := jsonb_build_object(
    'kind','use','useId','boss-story-use','visitId','boss-story-visit',
    'contentInstanceId','stories-content-instance:story-slot-s5',
    'visitOwnerId','s5-story','actionUseId','s5-story:content-use',
    'category','stories','slotId','story-slot-s5','recordId','story:scene-s5',
    'journeyStep',5,'transactionId','boss-route:5:s5','pairedUseId','boss-transfer-use',
    'evidenceEventId',boss_event ->> 'id','narrativeChoiceToken',' route-choice-b ',
    'attemptReceiptIds',jsonb_build_array(attempt_id)
  );
  boss_transfer_use := jsonb_build_object(
    'kind','use','useId','boss-transfer-use','visitId','boss-transfer-visit',
    'contentInstanceId','transfer-content-instance:transfer-slot-s5',
    'visitOwnerId','s5-transfer','actionUseId','s5-transfer:content-use',
    'category','transfer','slotId','transfer-slot-s5','recordId','transfer:s5',
    'journeyStep',5,'transactionId','boss-route:5:s5','pairedUseId','boss-story-use',
    'evidenceEventId',boss_event ->> 'id','narrativeChoiceToken','route-choice-b',
    'attemptReceiptIds',jsonb_build_array(attempt_id)
  );
  boss_receipt := jsonb_build_object(
    'kind','attempt_receipt','attemptId',attempt_id,'operation','story_transfer',
    'subjectId','boss-route:5:s5','decisionOrdinal',0,'attemptOrdinal',0,
    'inputSha256',repeat('b',64),'completed',true,'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(boss_event ->> 'id'),
    'useIds',jsonb_build_array('boss-story-use','boss-transfer-use')
  );
  boss_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'stories',jsonb_build_object(
      'visits',jsonb_build_object('boss-story-visit',boss_story_visit),
      'uses',jsonb_build_object('boss-story-use',boss_story_use)
    ),
    'transfer',jsonb_build_object(
      'visits',jsonb_build_object('boss-transfer-visit',boss_transfer_visit),
      'uses',jsonb_build_object('boss-transfer-use',boss_transfer_use)
    )
  ), '{}');
  valid_decks := public.lp_quest_valid_v2_content_decks(
    boss_decks,jsonb_build_object(attempt_id,boss_receipt),jsonb_build_array(boss_event)
  );
  if valid_decks #>> '{stories,uses,boss-story-use,narrativeChoiceToken}' <> 'route-choice-b'
    or valid_decks #>> '{transfer,uses,boss-transfer-use,narrativeChoiceToken}' <> 'route-choice-b'
    or boss_event ->> 'domain' <> 'novel_decoding'
    or boss_event ? 'activityType' then
    raise exception 'boss nonempty token or novel-decoding reciprocal pair failed';
  end if;

  tampered_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'stories',jsonb_build_object(
      'visits',jsonb_build_object('boss-story-visit',boss_story_visit),
      'uses',jsonb_build_object('boss-story-use',boss_story_use || jsonb_build_object(
        'narrativeChoiceToken',null
      ))
    ),
    'transfer',jsonb_build_object(
      'visits',jsonb_build_object('boss-transfer-visit',boss_transfer_visit),
      'uses',jsonb_build_object('boss-transfer-use',boss_transfer_use || jsonb_build_object(
        'narrativeChoiceToken',null
      ))
    )
  ), '{}');
  if public.lp_quest_valid_v2_content_decks(
      tampered_decks,jsonb_build_object(attempt_id,boss_receipt),jsonb_build_array(boss_event)
    ) #> '{stories,uses,boss-story-use}' is not null then
    raise exception 'boss null narrative token was accepted';
  end if;
  normalized := public.lp_quest_normalize_v2_deck_use(
    'stories','boss-blank-token',boss_story_use || jsonb_build_object(
      'useId','boss-blank-token','narrativeChoiceToken','   '
    )
  );
  if normalized <> '{"kind":"use_conflict","useId":"boss-blank-token"}'::jsonb then
    raise exception 'blank boss narrative token did not become exact conflict';
  end if;

  tampered_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'stories',jsonb_build_object(
      'visits',jsonb_build_object('story-ladder-visit',story_visit),
      'uses',jsonb_build_object('story-ladder-use',story_use || jsonb_build_object(
        'narrativeChoiceToken','non-boss-token'
      ))
    ),
    'transfer',jsonb_build_object(
      'visits',jsonb_build_object('transfer-ladder-visit',transfer_visit),
      'uses',jsonb_build_object('transfer-ladder-use',transfer_use || jsonb_build_object(
        'narrativeChoiceToken','non-boss-token'
      ))
    )
  ), '{}');
  if public.lp_quest_valid_v2_content_decks(
      tampered_decks,story_receipts,story_events
    ) #> '{stories,uses,story-ladder-use}' is not null then
    raise exception 'non-boss non-null narrative token was accepted';
  end if;

  tampered_decks := public.lp_quest_merge_v2_content_decks(
    boss_decks,jsonb_build_object('transfer',jsonb_build_object(
      'visits','{}'::jsonb,
      'uses',jsonb_build_object('boss-transfer-use',boss_transfer_use || jsonb_build_object(
        'narrativeChoiceToken','route-choice-c'
      ))
    ))
  );
  if tampered_decks #>> '{transfer,uses,boss-transfer-use,kind}' <> 'use_conflict'
    or public.lp_quest_valid_v2_content_decks(
      tampered_decks,jsonb_build_object(attempt_id,boss_receipt),jsonb_build_array(boss_event)
    ) #> '{stories,uses,boss-story-use}' is not null then
    raise exception 'reciprocal token mismatch did not conflict and reject the pair';
  end if;

  tampered_transfer_visit := transfer_visit || jsonb_build_object('journeyStep',3);
  tampered_transfer_use := transfer_use || jsonb_build_object('journeyStep',3);
  tampered_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'stories',jsonb_build_object(
      'visits',jsonb_build_object('story-ladder-visit',story_visit),
      'uses',jsonb_build_object('story-ladder-use',story_use)
    ),
    'transfer',jsonb_build_object(
      'visits',jsonb_build_object('transfer-ladder-visit',tampered_transfer_visit),
      'uses',jsonb_build_object('transfer-ladder-use',tampered_transfer_use)
    )
  ), '{}');
  valid_decks := public.lp_quest_valid_v2_content_decks(
    tampered_decks,story_receipts,story_events
  );
  if valid_decks #> '{stories,uses,story-ladder-use}' is not null
    or valid_decks #> '{transfer,uses,transfer-ladder-use}' is not null then
    raise exception 'pair-parent journey mismatch did not reject both halves';
  end if;

  tampered_transfer_visit := transfer_visit || jsonb_build_object('stopId','s3');
  tampered_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'stories',jsonb_build_object(
      'visits',jsonb_build_object('story-ladder-visit',story_visit),
      'uses',jsonb_build_object('story-ladder-use',story_use)
    ),
    'transfer',jsonb_build_object(
      'visits',jsonb_build_object('transfer-ladder-visit',tampered_transfer_visit),
      'uses',jsonb_build_object('transfer-ladder-use',transfer_use)
    )
  ), '{}');
  valid_decks := public.lp_quest_valid_v2_content_decks(
    tampered_decks,story_receipts,story_events
  );
  if valid_decks #> '{stories,uses,story-ladder-use}' is not null
    or valid_decks #> '{transfer,uses,transfer-ladder-use}' is not null then
    raise exception 'pair-parent stop mismatch did not reject both halves';
  end if;

  tampered_transfer_use := transfer_use || jsonb_build_object(
    'contentInstanceId','invalid-transfer-parent-instance'
  );
  tampered_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'stories',jsonb_build_object(
      'visits',jsonb_build_object('story-ladder-visit',story_visit),
      'uses',jsonb_build_object('story-ladder-use',story_use)
    ),
    'transfer',jsonb_build_object(
      'visits',jsonb_build_object('transfer-ladder-visit',transfer_visit),
      'uses',jsonb_build_object('transfer-ladder-use',tampered_transfer_use)
    )
  ), '{}');
  valid_decks := public.lp_quest_valid_v2_content_decks(
    tampered_decks,story_receipts,story_events
  );
  if valid_decks #> '{stories,uses,story-ladder-use}' is not null
    or valid_decks #> '{transfer,uses,transfer-ladder-use}' is not null then
    raise exception 'pair-parent full identity mismatch did not reject both halves';
  end if;

  tampered_decks := public.lp_quest_merge_v2_content_decks(
    story_decks,jsonb_build_object('transfer',jsonb_build_object(
      'visits','{}'::jsonb,
      'uses',jsonb_build_object('transfer-ladder-shadow',transfer_use || jsonb_build_object(
        'useId','transfer-ladder-shadow','contentInstanceId','invalid-transfer-parent-instance'
      ))
    ))
  );
  valid_decks := public.lp_quest_valid_v2_content_decks(
    tampered_decks,story_receipts,story_events
  );
  if (select count(*) from jsonb_object_keys(tampered_decks #> '{transfer,uses}')) <> 2
    or valid_decks #> '{stories,uses,story-ladder-use}' is not null
    or valid_decks #> '{transfer,uses,transfer-ladder-use}' is not null then
    raise exception 'invalid-parent duplicate pair claim did not poison both halves';
  end if;
end;
$$;

-- Multi-target placement history, the full correction ladder, and exact result shapes.
do $$
declare
  alt37_visit jsonb;
  alt37_use jsonb;
  alt37_decks jsonb;
  alt37_events jsonb := '[]'::jsonb;
  alt37_receipts jsonb := '{}'::jsonb;
  attempt_id text;
  attempt_number int;
  event_value jsonb;
  receipt_value jsonb;
  valid_receipts jsonb;
  valid_decks jsonb;
  reloaded_decks jsonb;
  reloaded_receipts jsonb;
  ladder_visit jsonb;
  ladder_use jsonb;
  ladder_decks jsonb;
  ladder_events jsonb := '[]'::jsonb;
  ladder_receipts jsonb := '{}'::jsonb;
  model_checkpoint jsonb;
  response_checkpoint jsonb;
  state_model jsonb;
  state_response jsonb;
  merged_state jsonb;
  bad_receipt jsonb;
  event_morph_visit jsonb;
  event_morph_use jsonb;
  event_morph_decks jsonb;
  event_morph_event jsonb;
  event_morph_receipt jsonb;
begin
  alt37_visit := jsonb_build_object(
    'kind','visit','visitId','alt37-visit',
    'contentInstanceId','alternatives-content-instance:alternative-slot-s37',
    'visitOwnerId','s37-alternative','ownerActionUseId','s37-alternative:content-use',
    'category','alternatives','slotId','alternative-slot-s37','recordId','alternative:s37',
    'contentId','alternative:s37','targetId',null,'wordId',null,'stopId','s37',
    'journeyStep',37,'ownerActivityType','encoding'
  );
  alt37_use := jsonb_build_object(
    'kind','use','useId','alt37-use','visitId','alt37-visit',
    'contentInstanceId','alternatives-content-instance:alternative-slot-s37',
    'visitOwnerId','s37-alternative','actionUseId','s37-alternative:content-use',
    'category','alternatives','slotId','alternative-slot-s37','recordId','alternative:s37',
    'journeyStep',37,
    'attemptReceiptIds',jsonb_build_array(
      'content-placement-attempt:alt37-visit:s37-alternative:0:0',
      'content-placement-attempt:alt37-visit:s37-alternative:0:1',
      'content-placement-attempt:alt37-visit:s37-alternative:1:0',
      'content-placement-attempt:alt37-visit:s37-alternative:2:0',
      'content-placement-attempt:alt37-visit:s37-alternative:3:0'
    )
  );

  attempt_id := 'content-placement-attempt:alt37-visit:s37-alternative:0:0';
  event_value := jsonb_build_object(
    'id',attempt_id || ':0','at','2026-09-02T01:00:00.000Z',
    'evidenceKind','practice','domain','grapheme_to_phoneme','targetId','gpc:c_s',
    'word',null,'position',null,'connectedTextId',null,'bossTransferId',null,
    'correct',false,'supportLevel',0,'revealed',false
  );
  receipt_value := jsonb_build_object(
    'kind','attempt_receipt','attemptId',attempt_id,'operation','content_placement',
    'subjectId','s37-alternative','decisionOrdinal',0,'attemptOrdinal',0,
    'inputSha256',repeat('1',64),'completed',false,
    'correctionRecordIds',jsonb_build_array('content-correction:' || attempt_id),
    'eventIds',jsonb_build_array(event_value ->> 'id'),'useIds','[]'::jsonb
  );
  alt37_events := alt37_events || jsonb_build_array(event_value);
  alt37_receipts := alt37_receipts || jsonb_build_object(attempt_id,receipt_value);

  attempt_id := 'content-placement-attempt:alt37-visit:s37-alternative:0:1';
  event_value := event_value || jsonb_build_object(
    'id',attempt_id || ':0','at','2026-09-02T01:00:01.000Z',
    'correct',true,'supportLevel',1,'revealed',false
  );
  receipt_value := jsonb_build_object(
    'kind','attempt_receipt','attemptId',attempt_id,'operation','content_placement',
    'subjectId','s37-alternative','decisionOrdinal',0,'attemptOrdinal',1,
    'inputSha256',repeat('2',64),'completed',false,
    'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(event_value ->> 'id'),'useIds','[]'::jsonb
  );
  alt37_events := alt37_events || jsonb_build_array(event_value);
  alt37_receipts := alt37_receipts || jsonb_build_object(attempt_id,receipt_value);

  attempt_id := 'content-placement-attempt:alt37-visit:s37-alternative:1:0';
  event_value := event_value || jsonb_build_object(
    'id',attempt_id || ':0','at','2026-09-02T01:00:02.000Z','targetId','gpc:g_j',
    'correct',true,'supportLevel',0,'revealed',false
  );
  receipt_value := jsonb_build_object(
    'kind','attempt_receipt','attemptId',attempt_id,'operation','content_placement',
    'subjectId','s37-alternative','decisionOrdinal',1,'attemptOrdinal',0,
    'inputSha256',repeat('3',64),'completed',false,
    'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(event_value ->> 'id'),'useIds','[]'::jsonb
  );
  alt37_events := alt37_events || jsonb_build_array(event_value);
  alt37_receipts := alt37_receipts || jsonb_build_object(attempt_id,receipt_value);

  attempt_id := 'content-placement-attempt:alt37-visit:s37-alternative:2:0';
  event_value := event_value || jsonb_build_object(
    'id',attempt_id || ':0','at','2026-09-02T01:00:03.000Z','targetId','gpc:ch_k',
    'correct',true
  );
  receipt_value := jsonb_build_object(
    'kind','attempt_receipt','attemptId',attempt_id,'operation','content_placement',
    'subjectId','s37-alternative','decisionOrdinal',2,'attemptOrdinal',0,
    'inputSha256',repeat('4',64),'completed',false,
    'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(event_value ->> 'id'),'useIds','[]'::jsonb
  );
  alt37_events := alt37_events || jsonb_build_array(event_value);
  alt37_receipts := alt37_receipts || jsonb_build_object(attempt_id,receipt_value);

  attempt_id := 'content-placement-attempt:alt37-visit:s37-alternative:3:0';
  event_value := event_value || jsonb_build_object(
    'id',attempt_id || ':0','at','2026-09-02T01:00:04.000Z','targetId','gpc:ea_e',
    'correct',true
  );
  receipt_value := jsonb_build_object(
    'kind','attempt_receipt','attemptId',attempt_id,'operation','content_placement',
    'subjectId','s37-alternative','decisionOrdinal',3,'attemptOrdinal',0,
    'inputSha256',repeat('5',64),'completed',true,
    'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(event_value ->> 'id'),'useIds',jsonb_build_array('alt37-use')
  );
  alt37_events := alt37_events || jsonb_build_array(event_value);
  alt37_receipts := alt37_receipts || jsonb_build_object(attempt_id,receipt_value);

  alt37_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'alternatives',jsonb_build_object(
      'visits',jsonb_build_object('alt37-visit',alt37_visit),
      'uses',jsonb_build_object('alt37-use',alt37_use)
    )
  ), '{}');
  valid_receipts := public.lp_quest_valid_v2_attempt_receipts(
    alt37_events,alt37_decks,alt37_receipts
  );
  valid_decks := public.lp_quest_valid_v2_content_decks(
    alt37_decks,alt37_receipts,alt37_events
  );
  if (select count(*) from jsonb_object_keys(valid_receipts)) <> 5
    or valid_receipts #>> '{content-placement-attempt:alt37-visit:s37-alternative:0:0,completed}' <> 'false'
    or valid_receipts #>> '{content-placement-attempt:alt37-visit:s37-alternative:0:1,completed}' <> 'false'
    or valid_receipts #>> '{content-placement-attempt:alt37-visit:s37-alternative:1:0,completed}' <> 'false'
    or valid_receipts #>> '{content-placement-attempt:alt37-visit:s37-alternative:3:0,completed}' <> 'true'
    or valid_decks #> '{alternatives,uses,alt37-use}' is null then
    raise exception 'multi-target first-miss/retry/intermediate/final chain was not valid';
  end if;
  if alt37_events #> '{0}' ? 'activityType'
    or alt37_events #> '{0,word}' <> 'null'::jsonb
    or alt37_events #> '{0,position}' <> 'null'::jsonb
    or alt37_events #> '{0,connectedTextId}' <> 'null'::jsonb
    or alt37_events #> '{0,bossTransferId}' <> 'null'::jsonb then
    raise exception 'non-heart placement evidence lost canonical null identities';
  end if;
  reloaded_decks := public.lp_quest_merge_v2_content_decks(alt37_decks,'{}');
  reloaded_receipts := public.lp_quest_union_v2_attempt_receipts(alt37_receipts,'{}');
  if reloaded_decks <> alt37_decks
    or reloaded_receipts <> alt37_receipts
    or public.lp_quest_valid_v2_content_decks(
      reloaded_decks,reloaded_receipts,public.lp_quest_union_v2_evidence(alt37_events,'[]')
    ) <> valid_decks then
    raise exception 'reload-equivalent multi-target projection changed';
  end if;

  ladder_visit := jsonb_build_object(
    'kind','visit','visitId','placement-ladder-visit',
    'contentInstanceId','alternatives-content-instance:alternative-slot-s28',
    'visitOwnerId','s28-alternative','ownerActionUseId','s28-alternative:content-use',
    'category','alternatives','slotId','alternative-slot-s28','recordId','alternative:s28',
    'contentId','alternative:s28','targetId',null,'wordId',null,'stopId','s28','journeyStep',28
  );
  ladder_use := jsonb_build_object(
    'kind','use','useId','placement-ladder-use','visitId','placement-ladder-visit',
    'contentInstanceId','alternatives-content-instance:alternative-slot-s28',
    'visitOwnerId','s28-alternative','actionUseId','s28-alternative:content-use',
    'category','alternatives','slotId','alternative-slot-s28','recordId','alternative:s28',
    'journeyStep',28,'attemptReceiptIds',jsonb_build_array(
      'content-placement-attempt:placement-ladder-visit:s28-alternative:0:0',
      'content-placement-attempt:placement-ladder-visit:s28-alternative:0:1',
      'content-placement-attempt:placement-ladder-visit:s28-alternative:0:2',
      'content-placement-attempt:placement-ladder-visit:s28-alternative:0:3'
    )
  );
  for attempt_number in 0..3 loop
    attempt_id := format(
      'content-placement-attempt:placement-ladder-visit:s28-alternative:0:%s',
      attempt_number
    );
    event_value := jsonb_build_object(
      'id',attempt_id || ':0','at',format('2026-09-02T01:01:0%s.000Z',attempt_number),
      'evidenceKind','practice','domain','grapheme_to_phoneme','targetId','gpc:oo_short',
      'word',null,'position',null,'connectedTextId',null,'bossTransferId',null,
      'correct',attempt_number = 3,'supportLevel',least(attempt_number,3),
      'revealed',attempt_number >= 3
    );
    receipt_value := jsonb_build_object(
      'kind','attempt_receipt','attemptId',attempt_id,'operation','content_placement',
      'subjectId','s28-alternative','decisionOrdinal',0,'attemptOrdinal',attempt_number,
      'inputSha256',repeat((6 + attempt_number)::text,64),
      'completed',attempt_number = 3,
      'correctionRecordIds',case when attempt_number < 3
        then jsonb_build_array('content-correction:' || attempt_id) else '[]'::jsonb end,
      'eventIds',jsonb_build_array(event_value ->> 'id'),
      'useIds',case when attempt_number = 3
        then jsonb_build_array('placement-ladder-use') else '[]'::jsonb end
    );
    ladder_events := ladder_events || jsonb_build_array(event_value);
    ladder_receipts := ladder_receipts || jsonb_build_object(attempt_id,receipt_value);
  end loop;
  ladder_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'alternatives',jsonb_build_object(
      'visits',jsonb_build_object('placement-ladder-visit',ladder_visit),
      'uses',jsonb_build_object('placement-ladder-use',ladder_use)
    )
  ), '{}');
  valid_receipts := public.lp_quest_valid_v2_attempt_receipts(
    ladder_events,ladder_decks,ladder_receipts
  );
  valid_decks := public.lp_quest_valid_v2_content_decks(
    ladder_decks,ladder_receipts,ladder_events
  );
  if (select count(*) from jsonb_object_keys(valid_receipts)) <> 4
    or valid_decks #> '{alternatives,uses,placement-ladder-use}' is null
    or ladder_events #>> '{0,supportLevel}' <> '0'
    or ladder_events #>> '{1,supportLevel}' <> '1'
    or ladder_events #>> '{2,supportLevel}' <> '2'
    or ladder_events #>> '{3,supportLevel}' <> '3'
    or ladder_events #>> '{3,revealed}' <> 'true' then
    raise exception 'placement correction ladder 0/1/2/3 was not accepted exactly';
  end if;

  model_checkpoint := jsonb_build_object(
    'contentVersion','sound-seekers-v2',
    'contentPlacement',jsonb_build_object(
      'kind','content_placement','placementId','s28-alternative','category','alternatives',
      'visitId','placement-ladder-visit','stopId','s28','journeyStep',28,
      'stage','model_pending','targetOrdinal',0,'attemptOrdinal',3,
      'attemptId','content-placement-attempt:placement-ladder-visit:s28-alternative:0:3'
    )
  );
  response_checkpoint := jsonb_set(
    model_checkpoint,'{contentPlacement,stage}','"response_pending"'::jsonb
  );
  state_model := jsonb_build_object(
    'v',2,'contentVersion','sound-seekers-v2','reset',jsonb_build_object('epoch',0,'at',0),
    'trail',jsonb_build_object('routeCursor',1,'journeyStep',28),
    'contentDecks',ladder_decks,'attemptReceipts',ladder_receipts,
    'evidence',ladder_events,'checkpoint',model_checkpoint
  );
  state_response := state_model || jsonb_build_object('checkpoint',response_checkpoint);
  merged_state := public.lp_quest_merge_learning_v2(state_model,state_response);
  if (model_checkpoint #> '{contentPlacement}') - 'stage'
      <> (response_checkpoint #> '{contentPlacement}') - 'stage'
    or model_checkpoint #>> '{contentPlacement,attemptId}'
      <> response_checkpoint #>> '{contentPlacement,attemptId}'
    or public.lp_quest_merge_learning_v2(state_model,state_model) #> '{checkpoint}'
      <> model_checkpoint
    or merged_state #> '{checkpoint}' <> response_checkpoint
    or merged_state #>> '{checkpoint,contentPlacement,stage}' <> 'response_pending'
    or merged_state #>> '{checkpoint,contentPlacement,attemptId}'
      <> 'content-placement-attempt:placement-ladder-visit:s28-alternative:0:3' then
    raise exception 'placement model_pending to response_pending changed more than stage';
  end if;

  -- A correct event with no use is valid only while incomplete.
  bad_receipt := alt37_receipts
    -> 'content-placement-attempt:alt37-visit:s37-alternative:1:0';
  bad_receipt := bad_receipt || jsonb_build_object('completed',true);
  if public.lp_quest_valid_v2_attempt_receipts(
      alt37_events,alt37_decks,jsonb_build_object(bad_receipt ->> 'attemptId',bad_receipt)
    ) ? (bad_receipt ->> 'attemptId') then
    raise exception 'completed correct placement receipt with zero uses was accepted';
  end if;
  bad_receipt := alt37_receipts
    -> 'content-placement-attempt:alt37-visit:s37-alternative:3:0';
  bad_receipt := bad_receipt || jsonb_build_object('completed',false);
  if public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(alt37_events #> '{4}'),alt37_decks,
      jsonb_build_object(bad_receipt ->> 'attemptId',bad_receipt)
    ) ? (bad_receipt ->> 'attemptId') then
    raise exception 'incomplete correct placement receipt with one use was accepted';
  end if;

  event_morph_visit := jsonb_build_object(
    'kind','visit','visitId','event-morph-visit',
    'contentInstanceId','morphology-content-instance:morphology-slot-s38',
    'visitOwnerId','s38-morphology','ownerActionUseId','s38-morphology:content-use',
    'category','morphology','slotId','morphology-slot-s38',
    'recordId','morphology:s38:suffix_s','contentId','morphology:suffix_s:cats',
    'targetId',null,'wordId','cats','stopId','s38','journeyStep',38
  );
  attempt_id := 'content-placement-attempt:event-morph-visit:s38-morphology:0:0';
  event_morph_use := jsonb_build_object(
    'kind','use','useId','event-morph-use','visitId','event-morph-visit',
    'contentInstanceId','morphology-content-instance:morphology-slot-s38',
    'visitOwnerId','s38-morphology','actionUseId','s38-morphology:content-use',
    'category','morphology','slotId','morphology-slot-s38',
    'recordId','morphology:s38:suffix_s','journeyStep',38,
    'attemptReceiptIds',jsonb_build_array(attempt_id)
  );
  event_morph_event := jsonb_build_object(
    'id',attempt_id || ':0','at','2026-09-02T01:02:00.000Z',
    'evidenceKind','practice','domain','word_decoding','correct',true,
    'supportLevel',0,'revealed',false
  );
  event_morph_receipt := jsonb_build_object(
    'kind','attempt_receipt','attemptId',attempt_id,'operation','content_placement',
    'subjectId','s38-morphology','decisionOrdinal',0,'attemptOrdinal',0,
    'inputSha256',repeat('f',64),'completed',true,'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(event_morph_event ->> 'id'),
    'useIds',jsonb_build_array('event-morph-use')
  );
  event_morph_decks := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'morphology',jsonb_build_object(
      'visits',jsonb_build_object('event-morph-visit',event_morph_visit),
      'uses',jsonb_build_object('event-morph-use',event_morph_use)
    )
  ), '{}');
  if public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(event_morph_event),event_morph_decks,
      jsonb_build_object(attempt_id,event_morph_receipt)
    ) ? attempt_id
    or public.lp_quest_valid_v2_content_decks(
      event_morph_decks,jsonb_build_object(attempt_id,event_morph_receipt),
      jsonb_build_array(event_morph_event)
    ) #> '{morphology,uses,event-morph-use}' is not null then
    raise exception 'event-bearing morphology completion was accepted';
  end if;
end;
$$;

-- Scalar-type parity, malformed immutable receipts, and category-field boundaries.
do $$
declare
  base_visit jsonb;
  base_use jsonb;
  base_receipt jsonb;
  base_event jsonb;
  normalized jsonb;
  field_name text;
  bad_value jsonb;
  bad_case jsonb;
  bad_receipts jsonb;
  alt_normalized jsonb;
  story_incomplete jsonb;
begin
  base_visit := jsonb_build_object(
    'kind','visit','visitId','scalar-visit',
    'contentInstanceId','alternatives-content-instance:scalar',
    'visitOwnerId','s28-alternative','ownerActionUseId','s28-alternative:content-use',
    'category','alternatives','slotId','alternative-slot-s28','recordId','alternative:s28',
    'contentId','alternative:s28','targetId',null,'wordId',null,'stopId','s28',
    'journeyStep',28
  );
  base_use := jsonb_build_object(
    'kind','use','useId','scalar-use','visitId','scalar-visit',
    'contentInstanceId','alternatives-content-instance:scalar',
    'visitOwnerId','s28-alternative','actionUseId','s28-alternative:content-use',
    'category','alternatives','slotId','alternative-slot-s28','recordId','alternative:s28',
    'journeyStep',28,
    'attemptReceiptIds',jsonb_build_array(
      'content-placement-attempt:scalar-visit:s28-alternative:0:0'
    )
  );
  base_event := jsonb_build_object(
    'id','content-placement-attempt:scalar-visit:s28-alternative:0:0:0',
    'at','2026-09-02T03:00:00.000Z','evidenceKind','practice',
    'domain','grapheme_to_phoneme','correct',true,'supportLevel',0,'revealed',false
  );
  base_receipt := jsonb_build_object(
    'kind','attempt_receipt',
    'attemptId','content-placement-attempt:scalar-visit:s28-alternative:0:0',
    'operation','content_placement','subjectId','s28-alternative',
    'decisionOrdinal',0,'attemptOrdinal',0,'inputSha256',repeat('a',64),
    'completed',true,'correctionRecordIds','[]'::jsonb,
    'eventIds',jsonb_build_array(base_event ->> 'id'),
    'useIds',jsonb_build_array('scalar-use')
  );

  for bad_value in select value from jsonb_array_elements('[7,true,{"object":true}]'::jsonb)
  loop
    if jsonb_array_length(public.lp_quest_union_v2_evidence(
      jsonb_build_array(base_event || jsonb_build_object('id',bad_value)),'[]'
    )) <> 0 then
      raise exception 'non-string evidence id was retained';
    end if;
  end loop;

  for field_name in select unnest(array[
    'visitId','contentInstanceId','visitOwnerId','ownerActionUseId',
    'slotId','recordId','contentId','stopId'
  ])
  loop
    for bad_value in select value from jsonb_array_elements('[7,true,{"object":true}]'::jsonb)
    loop
      normalized := public.lp_quest_normalize_v2_deck_visit(
        'alternatives','scalar-visit',base_visit || jsonb_build_object(field_name,bad_value)
      );
      if normalized <> '{"kind":"visit_conflict","visitId":"scalar-visit"}'::jsonb then
        raise exception 'non-string visit identity field % was retained',field_name;
      end if;
    end loop;
  end loop;

  for field_name in select unnest(array[
    'useId','visitId','contentInstanceId','visitOwnerId','actionUseId','slotId','recordId'
  ])
  loop
    for bad_value in select value from jsonb_array_elements('[7,true,{"object":true}]'::jsonb)
    loop
      normalized := public.lp_quest_normalize_v2_deck_use(
        'alternatives','scalar-use',base_use || jsonb_build_object(field_name,bad_value)
      );
      if normalized <> '{"kind":"use_conflict","useId":"scalar-use"}'::jsonb then
        raise exception 'non-string use identity field % was retained',field_name;
      end if;
    end loop;
  end loop;

  story_incomplete := jsonb_build_object(
    'kind','use','useId','scalar-story-use','visitId','scalar-story-visit',
    'contentInstanceId','stories-content-instance:scalar',
    'visitOwnerId','s1-story','actionUseId','s1-story:content-use',
    'category','stories','slotId','story-slot-s1','recordId','story:scene-s1',
    'journeyStep',1,'transactionId','scalar-story','pairedUseId','scalar-transfer-use',
    'evidenceEventId','story-transfer-attempt:scalar-story:0:0',
    'narrativeChoiceToken',null,
    'attemptReceiptIds',jsonb_build_array('story-transfer-attempt:scalar-story:0')
  );
  for field_name in select unnest(array['transactionId','pairedUseId','evidenceEventId'])
  loop
    for bad_value in select value from jsonb_array_elements('[7,true,{"object":true}]'::jsonb)
    loop
      normalized := public.lp_quest_normalize_v2_deck_use(
        'stories','scalar-story-use',story_incomplete || jsonb_build_object(field_name,bad_value)
      );
      if normalized <> '{"kind":"use_conflict","useId":"scalar-story-use"}'::jsonb then
        raise exception 'non-string composite identity field % was retained',field_name;
      end if;
    end loop;
  end loop;

  for field_name in select unnest(array['attemptId','subjectId','inputSha256'])
  loop
    for bad_value in select value from jsonb_array_elements('[7,true,{"object":true}]'::jsonb)
    loop
      normalized := public.lp_quest_normalize_v2_attempt_receipt(
        base_receipt ->> 'attemptId',base_receipt || jsonb_build_object(field_name,bad_value)
      );
      if normalized <> jsonb_build_object(
        'kind','attempt_receipt_conflict','attemptId',base_receipt ->> 'attemptId'
      ) then
        raise exception 'non-string receipt identity field % was retained',field_name;
      end if;
    end loop;
  end loop;

  bad_receipts := jsonb_build_array(
    jsonb_build_object('field','attemptId','value','wrong-attempt-id'),
    jsonb_build_object('field','operation','value','unknown_operation'),
    jsonb_build_object('field','subjectId','value',''),
    jsonb_build_object('field','decisionOrdinal','value',-1),
    jsonb_build_object('field','decisionOrdinal','value','0'),
    jsonb_build_object('field','attemptOrdinal','value',-1),
    jsonb_build_object('field','attemptOrdinal','value','0'),
    jsonb_build_object('field','inputSha256','value',repeat('A',64)),
    jsonb_build_object('field','inputSha256','value','abc'),
    jsonb_build_object('field','completed','value','true'),
    jsonb_build_object('field','correctionRecordIds','value','not-an-array'),
    jsonb_build_object('field','correctionRecordIds','value',jsonb_build_array('x','x')),
    jsonb_build_object('field','correctionRecordIds','value',jsonb_build_array(null)),
    jsonb_build_object('field','eventIds','value','not-an-array'),
    jsonb_build_object('field','eventIds','value',jsonb_build_array('x','x')),
    jsonb_build_object('field','eventIds','value',jsonb_build_array(null)),
    jsonb_build_object('field','useIds','value','not-an-array'),
    jsonb_build_object('field','useIds','value',jsonb_build_array('x','x')),
    jsonb_build_object('field','useIds','value',jsonb_build_array(null))
  );
  for bad_case in select value from jsonb_array_elements(bad_receipts)
  loop
    normalized := public.lp_quest_normalize_v2_attempt_receipt(
      base_receipt ->> 'attemptId',
      base_receipt || jsonb_build_object(bad_case ->> 'field',bad_case -> 'value')
    );
    if normalized <> jsonb_build_object(
      'kind','attempt_receipt_conflict','attemptId',base_receipt ->> 'attemptId'
    ) then
      raise exception 'malformed receipt field % was retained',bad_case ->> 'field';
    end if;
  end loop;

  normalized := public.lp_quest_normalize_v2_attempt_receipt(
    base_receipt ->> 'attemptId',base_receipt || jsonb_build_object('unknown','strip-me')
  );
  if normalized <> base_receipt then
    raise exception 'unknown receipt field changed the normalized payload';
  end if;

  alt_normalized := public.lp_quest_normalize_v2_deck_use(
    'alternatives','scalar-use',base_use || jsonb_build_object(
      'transactionId','illegal','pairedUseId','illegal-pair',
      'evidenceEventId','illegal-event','narrativeChoiceToken','illegal-token',
      'unknown','strip-me'
    )
  );
  if alt_normalized ? 'transactionId' or alt_normalized ? 'pairedUseId'
    or alt_normalized ? 'evidenceEventId' or alt_normalized ? 'narrativeChoiceToken'
    or alt_normalized ? 'unknown' then
    raise exception 'illegal alternative composite fields were retained';
  end if;
  normalized := public.lp_quest_normalize_v2_deck_use(
    'stories','scalar-story-use',story_incomplete - 'pairedUseId'
  );
  if normalized <> '{"kind":"use_conflict","useId":"scalar-story-use"}'::jsonb then
    raise exception 'incomplete composite fields did not produce exact conflict';
  end if;
end;
$$;

-- Heart activities, shared ownership, replay identity, and duplicate-claim parity.
do $$
declare
  recognition_visit jsonb;
  recognition_use jsonb;
  sentence_visit jsonb;
  sentence_use jsonb;
  s6_visit jsonb;
  s6_owner_use jsonb;
  s6_shared_use jsonb;
  replay_visit jsonb;
  replay_use jsonb;
  owner_first jsonb;
  shared_first jsonb;
  shared_raw jsonb;
  projected jsonb;
  poisoned jsonb;
  normalized jsonb;
  activity_set jsonb;
begin
  recognition_visit := jsonb_build_object(
    'kind','visit','visitId','heart-recognition-visit',
    'contentInstanceId','heart-content-instance:recognition',
    'visitOwnerId','heart-recognition-owner',
    'ownerActionUseId','heart-recognition-owner:content-use',
    'category','heartWords','slotId','heart-slot-recognition','recordId','hw:a',
    'contentId','heart-word:a','targetId','hw:a','wordId','a','stopId','s1',
    'journeyStep',1,'ownerActivityType',' recognition ','ignored','strip-me'
  );
  recognition_use := jsonb_build_object(
    'kind','use','useId','heart-recognition-visit:heart-recognition-owner:content-use',
    'visitId','heart-recognition-visit',
    'contentInstanceId','heart-content-instance:recognition',
    'visitOwnerId','heart-recognition-owner',
    'actionUseId','heart-recognition-owner:content-use',
    'category','heartWords','slotId','heart-slot-recognition','recordId','hw:a',
    'journeyStep',1,'activityType',' recognition ','ignored','strip-me'
  );
  sentence_visit := jsonb_build_object(
    'kind','visit','visitId','heart-sentence-visit',
    'contentInstanceId','heart-content-instance:sentence',
    'visitOwnerId','heart-sentence-owner',
    'ownerActionUseId','heart-sentence-owner:content-use',
    'category','heartWords','slotId','heart-slot-sentence','recordId','hw:the',
    'contentId','heart-word:the','targetId','hw:the','wordId','the','stopId','s3',
    'journeyStep',3,'ownerActivityType','sentence_use'
  );
  sentence_use := jsonb_build_object(
    'kind','use','useId','heart-sentence-visit:heart-sentence-owner:content-use',
    'visitId','heart-sentence-visit','contentInstanceId','heart-content-instance:sentence',
    'visitOwnerId','heart-sentence-owner','actionUseId','heart-sentence-owner:content-use',
    'category','heartWords','slotId','heart-slot-sentence','recordId','hw:the',
    'journeyStep',3,'activityType','sentence_use'
  );
  s6_visit := jsonb_build_object(
    'kind','visit','visitId','heart-s6-visit',
    'contentInstanceId','heart-content-instance:heart-slot-s6-1',
    'visitOwnerId','s6-heart-1','ownerActionUseId','s6-heart-1:content-use',
    'category','heartWords','slotId','heart-slot-s6-1','recordId','hw:my',
    'contentId','heart-word:my','targetId','hw:my','wordId','my','stopId','s6',
    'journeyStep',6,'ownerActivityType',' encoding '
  );
  s6_owner_use := jsonb_build_object(
    'kind','use','useId','heart-s6-visit:s6-heart-1:content-use',
    'visitId','heart-s6-visit','contentInstanceId','heart-content-instance:heart-slot-s6-1',
    'visitOwnerId','s6-heart-1','actionUseId','s6-heart-1:content-use',
    'category','heartWords','slotId','heart-slot-s6-1','recordId','hw:my',
    'journeyStep',6,'activityType',' encoding '
  );
  s6_shared_use := jsonb_build_object(
    'kind','use','useId','heart-s6-visit:s6-primary:content-use',
    'visitId','heart-s6-visit','contentInstanceId','heart-content-instance:heart-slot-s6-1',
    'visitOwnerId','s6-heart-1','actionUseId','s6-primary:content-use',
    'category','heartWords','slotId','heart-slot-s6-1','recordId','hw:my',
    'journeyStep',6,'activityType',' heart_part_mapping '
  );

  shared_raw := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'heartWords',jsonb_build_object(
      'visits',jsonb_build_object(s6_visit ->> 'visitId',s6_visit),
      'uses',jsonb_build_object(s6_shared_use ->> 'useId',s6_shared_use)
    )
  ), '{}');
  if shared_raw #>> '{heartWords,uses,heart-s6-visit:s6-primary:content-use,kind}' <> 'use'
    or public.lp_quest_valid_v2_content_decks(shared_raw,'{}','[]')
      #> '{heartWords,uses,heart-s6-visit:s6-primary:content-use}' is not null then
    raise exception 'shared-before-owner was not retained raw and rejected from validity';
  end if;

  shared_first := public.lp_quest_merge_v2_content_decks(
    shared_raw,
    jsonb_build_object('heartWords',jsonb_build_object(
      'visits','{}'::jsonb,
      'uses',jsonb_build_object(s6_owner_use ->> 'useId',s6_owner_use)
    ))
  );
  owner_first := public.lp_quest_merge_v2_content_decks(
    jsonb_build_object('heartWords',jsonb_build_object(
      'visits',jsonb_build_object(s6_visit ->> 'visitId',s6_visit),
      'uses',jsonb_build_object(s6_owner_use ->> 'useId',s6_owner_use)
    )),
    jsonb_build_object('heartWords',jsonb_build_object(
      'visits','{}'::jsonb,
      'uses',jsonb_build_object(s6_shared_use ->> 'useId',s6_shared_use)
    ))
  );
  if shared_first <> owner_first then
    raise exception 's6 owner/shared raw merge depended on arrival order';
  end if;
  projected := public.lp_quest_valid_v2_content_decks(shared_first,'{}','[]');
  if projected #>> '{heartWords,uses,heart-s6-visit:s6-heart-1:content-use,activityType}'
      <> 'encoding'
    or projected #>> '{heartWords,uses,heart-s6-visit:s6-primary:content-use,activityType}'
      <> 'heart_part_mapping' then
    raise exception 'exact owner did not restore ordered s6 shared validity';
  end if;

  poisoned := public.lp_quest_merge_v2_content_decks(jsonb_build_object(
    'heartWords',jsonb_build_object(
      'visits',jsonb_build_object(s6_visit ->> 'visitId',s6_visit),
      'uses',jsonb_build_object(
        s6_owner_use ->> 'useId',s6_owner_use || jsonb_build_object(
          'activityType','recognition'
        ),
        s6_shared_use ->> 'useId',s6_shared_use
      )
    )
  ), '{}');
  projected := public.lp_quest_valid_v2_content_decks(poisoned,'{}','[]');
  if poisoned #>> '{heartWords,uses,heart-s6-visit:s6-heart-1:content-use,kind}' <> 'use'
    or projected #> '{heartWords,uses,heart-s6-visit:s6-heart-1:content-use}' is not null
    or projected #> '{heartWords,uses,heart-s6-visit:s6-primary:content-use}' is not null then
    raise exception 'owner activity mismatch did not exclude owner and shared dependent';
  end if;

  owner_first := public.lp_quest_merge_v2_content_decks(owner_first,jsonb_build_object(
    'heartWords',jsonb_build_object(
      'visits',jsonb_build_object(
        recognition_visit ->> 'visitId',recognition_visit,
        sentence_visit ->> 'visitId',sentence_visit
      ),
      'uses',jsonb_build_object(
        recognition_use ->> 'useId',recognition_use,
        sentence_use ->> 'useId',sentence_use
      )
    )
  ));
  projected := public.lp_quest_valid_v2_content_decks(owner_first,'{}','[]');
  select jsonb_agg(to_jsonb(activity) order by activity collate "C")
    into activity_set
    from (
      select distinct value ->> 'activityType' as activity
      from jsonb_each(projected #> '{heartWords,uses}')
    ) activities;
  if activity_set <> '["encoding","heart_part_mapping","recognition","sentence_use"]'::jsonb
    or projected #> '{heartWords,visits,heart-recognition-visit}' ? 'ignored'
    or projected #> '{heartWords,uses,heart-recognition-visit:heart-recognition-owner:content-use}' ? 'ignored' then
    raise exception 'all four canonical heart activities or unknown-field normalization failed';
  end if;

  replay_visit := s6_visit || jsonb_build_object(
    'visitId','heart-s6-replay-visit','journeyStep',46
  );
  replay_use := s6_owner_use || jsonb_build_object(
    'useId','heart-s6-replay-visit:s6-heart-1:content-use',
    'visitId','heart-s6-replay-visit','journeyStep',46
  );
  owner_first := public.lp_quest_merge_v2_content_decks(owner_first,jsonb_build_object(
    'heartWords',jsonb_build_object(
      'visits',jsonb_build_object(replay_visit ->> 'visitId',replay_visit),
      'uses',jsonb_build_object(replay_use ->> 'useId',replay_use)
    )
  ));
  projected := public.lp_quest_valid_v2_content_decks(owner_first,'{}','[]');
  if projected #>> '{heartWords,visits,heart-s6-replay-visit,journeyStep}' <> '46'
    or projected #>> '{heartWords,uses,heart-s6-replay-visit:s6-heart-1:content-use,journeyStep}' <> '46'
    or projected #> '{heartWords,visits,heart-s6-visit}' is null then
    raise exception 'later-step replay did not retain fresh visit/use identities';
  end if;

  poisoned := public.lp_quest_merge_v2_content_decks(shared_first,jsonb_build_object(
    'heartWords',jsonb_build_object('visits','{}'::jsonb,'uses',jsonb_build_object(
      'heart-s6-owner-shadow',s6_owner_use || jsonb_build_object(
        'useId','heart-s6-owner-shadow','contentInstanceId','invalid-parent-instance'
      )
    ))
  ));
  projected := public.lp_quest_valid_v2_content_decks(poisoned,'{}','[]');
  if (select count(*) from jsonb_object_keys(poisoned #> '{heartWords,uses}')) <> 3
    or projected #> '{heartWords,uses,heart-s6-visit:s6-heart-1:content-use}' is not null
    or projected #> '{heartWords,uses,heart-s6-visit:s6-primary:content-use}' is not null then
    raise exception 'duplicate exact owner action claim did not poison owner and shared validity';
  end if;

  normalized := public.lp_quest_normalize_v2_deck_visit(
    'heartWords','bad-heart-visit',s6_visit || jsonb_build_object(
      'visitId','bad-heart-visit','ownerActivityType','not-a-heart-activity'
    )
  );
  if normalized <> '{"kind":"visit_conflict","visitId":"bad-heart-visit"}'::jsonb then
    raise exception 'invalid heart owner activity did not become exact conflict marker';
  end if;
  normalized := public.lp_quest_normalize_v2_deck_use(
    'heartWords','bad-heart-use',s6_owner_use || jsonb_build_object(
      'useId','bad-heart-use','activityType','not-a-heart-activity'
    )
  );
  if normalized <> '{"kind":"use_conflict","useId":"bad-heart-use"}'::jsonb then
    raise exception 'invalid heart use activity did not become exact conflict marker';
  end if;
  normalized := public.lp_quest_normalize_v2_deck_visit(
    'alternatives','non-heart-owner-activity',jsonb_build_object(
      'kind','visit','visitId','non-heart-owner-activity',
      'contentInstanceId','alternatives-content-instance:test',
      'visitOwnerId','alternative-owner','ownerActionUseId','alternative-owner:content-use',
      'category','alternatives','slotId','alternative-slot-test','recordId','alternative:test',
      'contentId','alternative:test','targetId',null,'wordId',null,'stopId','s16',
      'journeyStep',16,'ownerActivityType','encoding'
    )
  );
  if normalized ? 'ownerActivityType' then
    raise exception 'non-heart visit retained ownerActivityType';
  end if;
end;
$$;

do $$
declare
  attempt_id text := 'content-placement-attempt:visit:required-fields:unknown-placement:0:0';
  visit_value jsonb := jsonb_build_object(
    'kind','visit','visitId','required-visit',
    'contentInstanceId','alternatives-content-instance:required',
    'visitOwnerId','required-owner','ownerActionUseId','required-owner:content-use',
    'category','alternatives','slotId','required-slot','recordId','alternative:required',
    'contentId','alternative:required','targetId',null,'wordId',null,
    'stopId','s16','journeyStep',16
  );
  use_value jsonb := jsonb_build_object(
    'kind','use','useId','required-use','visitId','required-visit',
    'contentInstanceId','alternatives-content-instance:required',
    'visitOwnerId','required-owner','actionUseId','required-owner:content-use',
    'category','alternatives','slotId','required-slot','recordId','alternative:required',
    'journeyStep',16,'attemptReceiptIds',jsonb_build_array(attempt_id)
  );
  receipt_value jsonb := jsonb_build_object(
    'kind','attempt_receipt','attemptId',attempt_id,'operation','content_placement',
    'subjectId','unknown-placement','decisionOrdinal',0,'attemptOrdinal',0,
    'inputSha256',repeat('b',64),'completed',false,
    'correctionRecordIds',jsonb_build_array('content-correction:' || attempt_id),
    'eventIds',jsonb_build_array(attempt_id || ':0'),'useIds','[]'::jsonb
  );
  event_value jsonb := jsonb_build_object(
    'id',attempt_id || ':0','at',1,'evidenceKind','practice',
    'correct',false,'supportLevel',0,'revealed',false
  );
  field_name text;
  normalized jsonb;
begin
  foreach field_name in array array['kind','journeyStep'] loop
    normalized := public.lp_quest_normalize_v2_deck_visit(
      'alternatives','required-visit',visit_value - field_name
    );
    if normalized <> '{"kind":"visit_conflict","visitId":"required-visit"}'::jsonb then
      raise exception 'missing required visit field % was accepted',field_name;
    end if;
    normalized := public.lp_quest_normalize_v2_deck_use(
      'alternatives','required-use',use_value - field_name
    );
    if normalized <> '{"kind":"use_conflict","useId":"required-use"}'::jsonb then
      raise exception 'missing required use field % was accepted',field_name;
    end if;
  end loop;

  foreach field_name in array array[
    'kind','attemptId','operation','subjectId','decisionOrdinal','attemptOrdinal',
    'inputSha256','completed','correctionRecordIds','eventIds','useIds'
  ] loop
    normalized := public.lp_quest_normalize_v2_attempt_receipt(
      attempt_id,receipt_value - field_name
    );
    if normalized <> jsonb_build_object(
      'kind','attempt_receipt_conflict','attemptId',attempt_id
    ) then
      raise exception 'missing required receipt field % was accepted',field_name;
    end if;
  end loop;

  foreach field_name in array array['correct','supportLevel','revealed'] loop
    normalized := public.lp_quest_valid_v2_attempt_receipts(
      jsonb_build_array(event_value - field_name),
      '{}'::jsonb,
      jsonb_build_object(attempt_id,receipt_value)
    );
    if normalized <> '{}'::jsonb then
      raise exception 'event missing required field % retained a receipt',field_name;
    end if;
  end loop;
end;
$$;
