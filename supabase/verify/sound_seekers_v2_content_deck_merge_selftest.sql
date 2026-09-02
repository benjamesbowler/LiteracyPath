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
