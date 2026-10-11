-- keel_api/scripts/db/seed/sql/024_contacts.sql
-- Production key-data seed: extended family contacts, relationships, and photo metadata.

WITH
    rajan AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Rajan', 'Ittyadathu', 'male', DATE '1965-04-02')
        RETURNING id
    ),
    anumol AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Anumol', 'Thomas', 'female', DATE '1969-05-24')
        RETURNING id
    ),
    ansa AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Ansa', 'Thomas', 'female', DATE '1995-01-12')
        RETURNING id
    ),
    midhun AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Midhun', 'Raj', 'male', DATE '1995-10-27')
        RETURNING id
    ),
    anita AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Anita', 'Raj', 'female', DATE '2004-05-16')
        RETURNING id
    ),
    thircoth_appachen AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Phillip', NULL, 'male', NULL)
        RETURNING id
    ),
    thircoth_ammachi AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Alice', NULL, 'female', NULL)
        RETURNING id
    ),
    thircoth_origin_father AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Thircoth origin', NULL, 'male', NULL, '')
        RETURNING id
    ),
    thircoth_origin_mother AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Thircoth origin', NULL, 'female', NULL, '')
        RETURNING id
    ),
    kuravilla_appachen AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Kuravilla', 'Appachen', 'male', NULL)
        RETURNING id
    ),
    ittyadathu_ammachi AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Ittyadathu', 'Ammachi', 'female', NULL)
        RETURNING id
    ),
    susumma_josa AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Susumma', 'Josa', 'female', NULL)
        RETURNING id
    ),
    appapy AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Appapy', NULL, 'male', NULL)
        RETURNING id
    ),
    jose_varghese AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Jose', 'Varghese', 'male', NULL)
        RETURNING id
    ),
    roshen_jose AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Roshen', 'Jose', 'male', NULL)
        RETURNING id
    ),
    chelsy_jose AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Chelsy', 'Jose', 'female', NULL)
        RETURNING id
    ),
    shiny_aunty AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Shiny', 'Aunty', 'female', NULL)
        RETURNING id
    ),
    amal_joseph AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Amal', 'Joseph', 'male', NULL)
        RETURNING id
    ),
    athul_joseph AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Athul', 'Joseph', 'male', NULL)
        RETURNING id
    ),
    johnnypappy AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Johnnypappy', NULL, 'male', NULL)
        RETURNING id
    ),
    valsamma_aunty AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Valsamma', 'Aunty', 'female', NULL)
        RETURNING id
    ),
    joel AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Joel', NULL, 'male', NULL)
        RETURNING id
    ),
    joshni AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Joshni', NULL, 'female', NULL)
        RETURNING id
    ),
    johanna AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Johanna', NULL, 'female', NULL)
        RETURNING id
    ),
    linson_rajan AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Linson', 'Rajan', 'male', NULL)
        RETURNING id
    ),
    cristin_chechi AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date)
        VALUES ('Cristin', 'Chechi', 'female', NULL)
        RETURNING id
    ),
    itty_origin_father AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Itty origin', NULL, 'male', NULL, '')
        RETURNING id
    ),
    itty_origin_mother AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Itty origin', NULL, 'female', NULL, '')
        RETURNING id
    ),
    thangamma_ammachi AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Thangamma', 'Ammachi', 'female', NULL, 'Pampadi ammachi')
        RETURNING id
    ),
    thankachen_appachen_pampadi AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Thankachen', 'Appachen', 'male', NULL, '')
        RETURNING id
    ),
    kunjumol_pampadi AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Kunjumol', NULL, 'female', NULL, '')
        RETURNING id
    ),
    manachen AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Manachen', NULL, 'male', NULL, '')
        RETURNING id
    ),
    reji AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Reji', NULL, 'male', NULL, '')
        RETURNING id
    ),
    ammani_ammachi AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Ammani', 'Ammachi', 'female', NULL, '')
        RETURNING id
    ),
    paul_papachen_appachen AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Paul', 'Appachen', 'male', NULL, 'Also known as Papachen')
        RETURNING id
    ),
    sajan AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Sajan', NULL, 'male', NULL, '')
        RETURNING id
    ),
    suja AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Suja', NULL, 'female', NULL, '')
        RETURNING id
    ),
    sam_ammani_child AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Sam', NULL, 'male', NULL, '')
        RETURNING id
    ),
    sunil AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Sunil', NULL, 'male', NULL, '')
        RETURNING id
    ),
    achenkunju_appachen AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Achenkunju', 'Appachen', 'male', NULL, 'Karotu')
        RETURNING id
    ),
    leela_ammachi AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Leela', 'Ammachi', 'female', NULL, '')
        RETURNING id
    ),
    manju AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Manju', NULL, 'female', NULL, '')
        RETURNING id
    ),
    renju AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Renju', NULL, 'female', NULL, '')
        RETURNING id
    ),
    meenu AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Meenu', NULL, 'female', NULL, '')
        RETURNING id
    ),
    krupa AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Krupa', NULL, 'female', NULL, '')
        RETURNING id
    ),
    thankachen_appachen_police AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Thankachen', 'Appachen', 'male', NULL, 'Police appachen')
        RETURNING id
    ),
    kunjumol_ammachi AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Kunjumol', 'Ammachi', 'female', NULL, '')
        RETURNING id
    ),
    binu AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Binu', NULL, 'female', NULL, '')
        RETURNING id
    ),
    bibi AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Bibi', NULL, 'female', NULL, '')
        RETURNING id
    ),
    bibin_police_child AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Bibin', NULL, 'male', NULL, '')
        RETURNING id
    ),
    mariamma_kadupil AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Mariamma', NULL, 'female', NULL, 'Also known as Kunjumariamma / ammai; Kadupil ammai')
        RETURNING id
    ),
    scaria_kunjumon AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Scaria', NULL, 'male', NULL, 'Also known as Kunjumon')
        RETURNING id
    ),
    sunish AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Sunish', NULL, 'male', NULL, '')
        RETURNING id
    ),
    shiny_sunish AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Shiny', NULL, 'female', NULL, '')
        RETURNING id
    ),
    anan AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Anan', NULL, 'male', NULL, '')
        RETURNING id
    ),
    kochurani AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Kochurani', NULL, 'female', NULL, '')
        RETURNING id
    ),
    madhu AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Madhu', NULL, 'male', NULL, '')
        RETURNING id
    ),
    reubin AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Reubin', NULL, 'male', NULL, '')
        RETURNING id
    ),
    roshen_kadupil AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Roshen', NULL, 'male', NULL, '')
        RETURNING id
    ),
    suni AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Suni', NULL, 'female', NULL, '')
        RETURNING id
    ),
    sebastin_ratheesh AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Sebastin', NULL, 'male', NULL, 'Also known as Ratheesh')
        RETURNING id
    ),
    rohan AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Rohan', NULL, 'male', NULL, '')
        RETURNING id
    ),
    nohan AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Nohan', NULL, 'male', NULL, '')
        RETURNING id
    ),
    annama_vakathanam AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Annama', NULL, 'female', NULL, 'Also known as Kunjannama; Vakathanam')
        RETURNING id
    ),
    babychan AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Babychan', NULL, 'male', NULL, '')
        RETURNING id
    ),
    abin AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Abin', NULL, 'male', NULL, '')
        RETURNING id
    ),
    sanuja AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Sanuja', NULL, 'female', NULL, '')
        RETURNING id
    ),
    blessen AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Blessen', NULL, 'male', NULL, '')
        RETURNING id
    ),
    linu AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Linu', NULL, 'female', NULL, '')
        RETURNING id
    ),
    philip_abraham AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Philip', 'Abraham', 'male', NULL, '')
        RETURNING id
    ),
    lizzy AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Lizzy', NULL, 'female', NULL, '')
        RETURNING id
    ),
    priya AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Priya', NULL, 'female', NULL, '')
        RETURNING id
    ),
    alan AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Alan', NULL, 'male', NULL, '')
        RETURNING id
    ),
    david AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('David', NULL, 'male', NULL, '')
        RETURNING id
    ),
    gia AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Gia', NULL, 'female', NULL, '')
        RETURNING id
    ),
    dia AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Dia', NULL, 'female', NULL, '')
        RETURNING id
    ),
    philemon AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Philemon', NULL, 'male', NULL, '')
        RETURNING id
    ),
    sonia AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Sonia', NULL, 'female', NULL, '')
        RETURNING id
    ),
    ivan AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Ivan', NULL, 'male', NULL, '')
        RETURNING id
    ),
    rachel AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Rachel', NULL, 'female', NULL, '')
        RETURNING id
    ),
    sam_philemon_child AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Sam', NULL, 'male', NULL, '')
        RETURNING id
    ),
    thamban AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Thamban', NULL, 'male', NULL, 'Also known as Thambi')
        RETURNING id
    ),
    cinni AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Cinni', NULL, 'female', NULL, '')
        RETURNING id
    ),
    swetha AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Swetha', NULL, 'female', NULL, '')
        RETURNING id
    ),
    bibin_swetha_spouse AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Bibin', NULL, 'male', NULL, 'Separate contact from Police appachen''s son Bibin')
        RETURNING id
    ),
    summitha AS (
        INSERT INTO contacts (first_name, last_name, gender, birth_date, notes)
        VALUES ('Summitha', NULL, 'female', NULL, '')
        RETURNING id
    ),
    rels AS (
        INSERT INTO contact_relationships (from_contact_id, to_contact_id, relationship_type)
        SELECT r.id, a.id, 'spouse' FROM rajan r, anumol a
        UNION ALL SELECT r.id, an.id, 'parent' FROM rajan r, ansa an
        UNION ALL SELECT r.id, m.id, 'parent' FROM rajan r, midhun m
        UNION ALL SELECT r.id, ai.id, 'parent' FROM rajan r, anita ai
        UNION ALL SELECT a.id, an.id, 'parent' FROM anumol a, ansa an
        UNION ALL SELECT a.id, m.id, 'parent' FROM anumol a, midhun m
        UNION ALL SELECT a.id, ai.id, 'parent' FROM anumol a, anita ai
        UNION ALL SELECT t.id, ta.id, 'spouse' FROM thircoth_appachen t, thircoth_ammachi ta
        UNION ALL SELECT tof.id, tom.id, 'spouse' FROM thircoth_origin_father tof, thircoth_origin_mother tom
        UNION ALL SELECT tof.id, t.id, 'parent' FROM thircoth_origin_father tof, thircoth_appachen t
        UNION ALL SELECT tom.id, t.id, 'parent' FROM thircoth_origin_mother tom, thircoth_appachen t
        UNION ALL SELECT t.id, a.id, 'parent' FROM thircoth_appachen t, anumol a
        UNION ALL SELECT ta.id, a.id, 'parent' FROM thircoth_ammachi ta, anumol a
        UNION ALL SELECT ia.id, iam.id, 'spouse' FROM kuravilla_appachen ia, ittyadathu_ammachi iam
        UNION ALL SELECT ia.id, r.id, 'parent' FROM kuravilla_appachen ia, rajan r
        UNION ALL SELECT iam.id, r.id, 'parent' FROM ittyadathu_ammachi iam, rajan r
        UNION ALL SELECT ia.id, s.id, 'parent' FROM kuravilla_appachen ia, susumma_josa s
        UNION ALL SELECT iam.id, s.id, 'parent' FROM ittyadathu_ammachi iam, susumma_josa s
        UNION ALL SELECT ia.id, ap.id, 'parent' FROM kuravilla_appachen ia, appapy ap
        UNION ALL SELECT iam.id, ap.id, 'parent' FROM ittyadathu_ammachi iam, appapy ap
        UNION ALL SELECT ia.id, va.id, 'parent' FROM kuravilla_appachen ia, valsamma_aunty va
        UNION ALL SELECT iam.id, va.id, 'parent' FROM ittyadathu_ammachi iam, valsamma_aunty va
        UNION ALL SELECT j.id, s.id, 'spouse' FROM jose_varghese j, susumma_josa s
        UNION ALL SELECT j.id, r.id, 'parent' FROM jose_varghese j, roshen_jose r
        UNION ALL SELECT s.id, r.id, 'parent' FROM susumma_josa s, roshen_jose r
        UNION ALL SELECT j.id, c.id, 'parent' FROM jose_varghese j, chelsy_jose c
        UNION ALL SELECT s.id, c.id, 'parent' FROM susumma_josa s, chelsy_jose c
        UNION ALL SELECT ap.id, sh.id, 'spouse' FROM appapy ap, shiny_aunty sh
        UNION ALL SELECT ap.id, am.id, 'parent' FROM appapy ap, amal_joseph am
        UNION ALL SELECT sh.id, am.id, 'parent' FROM shiny_aunty sh, amal_joseph am
        UNION ALL SELECT ap.id, at.id, 'parent' FROM appapy ap, athul_joseph at
        UNION ALL SELECT sh.id, at.id, 'parent' FROM shiny_aunty sh, athul_joseph at
        UNION ALL SELECT jp.id, va.id, 'spouse' FROM johnnypappy jp, valsamma_aunty va
        UNION ALL SELECT jp.id, jo.id, 'parent' FROM johnnypappy jp, joel jo
        UNION ALL SELECT va.id, jo.id, 'parent' FROM valsamma_aunty va, joel jo
        UNION ALL SELECT jp.id, jn.id, 'parent' FROM johnnypappy jp, joshni jn
        UNION ALL SELECT va.id, jn.id, 'parent' FROM valsamma_aunty va, joshni jn
        UNION ALL SELECT jp.id, jh.id, 'parent' FROM johnnypappy jp, johanna jh
        UNION ALL SELECT va.id, jh.id, 'parent' FROM valsamma_aunty va, johanna jh
        UNION ALL SELECT l.id, an.id, 'spouse' FROM linson_rajan l, ansa an
        UNION ALL SELECT r.id, c.id, 'spouse' FROM roshen_jose r, cristin_chechi c
        UNION ALL SELECT iof.id, iom.id, 'spouse' FROM itty_origin_father iof, itty_origin_mother iom
        UNION ALL SELECT iof.id, ia.id, 'parent' FROM itty_origin_father iof, kuravilla_appachen ia
        UNION ALL SELECT iom.id, ia.id, 'parent' FROM itty_origin_mother iom, kuravilla_appachen ia
        UNION ALL SELECT iof.id, tg.id, 'parent' FROM itty_origin_father iof, thangamma_ammachi tg
        UNION ALL SELECT iom.id, tg.id, 'parent' FROM itty_origin_mother iom, thangamma_ammachi tg
        UNION ALL SELECT iof.id, am.id, 'parent' FROM itty_origin_father iof, ammani_ammachi am
        UNION ALL SELECT iom.id, am.id, 'parent' FROM itty_origin_mother iom, ammani_ammachi am
        UNION ALL SELECT iof.id, ak.id, 'parent' FROM itty_origin_father iof, achenkunju_appachen ak
        UNION ALL SELECT iom.id, ak.id, 'parent' FROM itty_origin_mother iom, achenkunju_appachen ak
        UNION ALL SELECT iof.id, tp.id, 'parent' FROM itty_origin_father iof, thankachen_appachen_police tp
        UNION ALL SELECT iom.id, tp.id, 'parent' FROM itty_origin_mother iom, thankachen_appachen_police tp
        UNION ALL SELECT tg.id, tap.id, 'spouse' FROM thangamma_ammachi tg, thankachen_appachen_pampadi tap
        UNION ALL SELECT tg.id, kp.id, 'parent' FROM thangamma_ammachi tg, kunjumol_pampadi kp
        UNION ALL SELECT tap.id, kp.id, 'parent' FROM thankachen_appachen_pampadi tap, kunjumol_pampadi kp
        UNION ALL SELECT tg.id, mc.id, 'parent' FROM thangamma_ammachi tg, manachen mc
        UNION ALL SELECT tap.id, mc.id, 'parent' FROM thankachen_appachen_pampadi tap, manachen mc
        UNION ALL SELECT tg.id, rj.id, 'parent' FROM thangamma_ammachi tg, reji rj
        UNION ALL SELECT tap.id, rj.id, 'parent' FROM thankachen_appachen_pampadi tap, reji rj
        UNION ALL SELECT am.id, pa.id, 'spouse' FROM ammani_ammachi am, paul_papachen_appachen pa
        UNION ALL SELECT am.id, sj.id, 'parent' FROM ammani_ammachi am, sajan sj
        UNION ALL SELECT pa.id, sj.id, 'parent' FROM paul_papachen_appachen pa, sajan sj
        UNION ALL SELECT am.id, su.id, 'parent' FROM ammani_ammachi am, suja su
        UNION ALL SELECT pa.id, su.id, 'parent' FROM paul_papachen_appachen pa, suja su
        UNION ALL SELECT am.id, sm.id, 'parent' FROM ammani_ammachi am, sam_ammani_child sm
        UNION ALL SELECT pa.id, sm.id, 'parent' FROM paul_papachen_appachen pa, sam_ammani_child sm
        UNION ALL SELECT am.id, sn.id, 'parent' FROM ammani_ammachi am, sunil sn
        UNION ALL SELECT pa.id, sn.id, 'parent' FROM paul_papachen_appachen pa, sunil sn
        UNION ALL SELECT ak.id, la.id, 'spouse' FROM achenkunju_appachen ak, leela_ammachi la
        UNION ALL SELECT ak.id, mj.id, 'parent' FROM achenkunju_appachen ak, manju mj
        UNION ALL SELECT la.id, mj.id, 'parent' FROM leela_ammachi la, manju mj
        UNION ALL SELECT ak.id, rn.id, 'parent' FROM achenkunju_appachen ak, renju rn
        UNION ALL SELECT la.id, rn.id, 'parent' FROM leela_ammachi la, renju rn
        UNION ALL SELECT ak.id, me.id, 'parent' FROM achenkunju_appachen ak, meenu me
        UNION ALL SELECT la.id, me.id, 'parent' FROM leela_ammachi la, meenu me
        UNION ALL SELECT ak.id, kr.id, 'parent' FROM achenkunju_appachen ak, krupa kr
        UNION ALL SELECT la.id, kr.id, 'parent' FROM leela_ammachi la, krupa kr
        UNION ALL SELECT tp.id, ka.id, 'spouse' FROM thankachen_appachen_police tp, kunjumol_ammachi ka
        UNION ALL SELECT tp.id, bn.id, 'parent' FROM thankachen_appachen_police tp, binu bn
        UNION ALL SELECT ka.id, bn.id, 'parent' FROM kunjumol_ammachi ka, binu bn
        UNION ALL SELECT tp.id, bb.id, 'parent' FROM thankachen_appachen_police tp, bibi bb
        UNION ALL SELECT ka.id, bb.id, 'parent' FROM kunjumol_ammachi ka, bibi bb
        UNION ALL SELECT tp.id, bp.id, 'parent' FROM thankachen_appachen_police tp, bibin_police_child bp
        UNION ALL SELECT ka.id, bp.id, 'parent' FROM kunjumol_ammachi ka, bibin_police_child bp
        UNION ALL SELECT t.id, mk.id, 'parent' FROM thircoth_appachen t, mariamma_kadupil mk
        UNION ALL SELECT ta.id, mk.id, 'parent' FROM thircoth_ammachi ta, mariamma_kadupil mk
        UNION ALL SELECT t.id, av.id, 'parent' FROM thircoth_appachen t, annama_vakathanam av
        UNION ALL SELECT ta.id, av.id, 'parent' FROM thircoth_ammachi ta, annama_vakathanam av
        UNION ALL SELECT t.id, ph.id, 'parent' FROM thircoth_appachen t, philip_abraham ph
        UNION ALL SELECT ta.id, ph.id, 'parent' FROM thircoth_ammachi ta, philip_abraham ph
        UNION ALL SELECT t.id, tb.id, 'parent' FROM thircoth_appachen t, thamban tb
        UNION ALL SELECT ta.id, tb.id, 'parent' FROM thircoth_ammachi ta, thamban tb
        UNION ALL SELECT mk.id, sc.id, 'spouse' FROM mariamma_kadupil mk, scaria_kunjumon sc
        UNION ALL SELECT mk.id, su.id, 'parent' FROM mariamma_kadupil mk, sunish su
        UNION ALL SELECT sc.id, su.id, 'parent' FROM scaria_kunjumon sc, sunish su
        UNION ALL SELECT mk.id, kc.id, 'parent' FROM mariamma_kadupil mk, kochurani kc
        UNION ALL SELECT sc.id, kc.id, 'parent' FROM scaria_kunjumon sc, kochurani kc
        UNION ALL SELECT mk.id, sn.id, 'parent' FROM mariamma_kadupil mk, suni sn
        UNION ALL SELECT sc.id, sn.id, 'parent' FROM scaria_kunjumon sc, suni sn
        UNION ALL SELECT su.id, sh.id, 'spouse' FROM sunish su, shiny_sunish sh
        UNION ALL SELECT su.id, an.id, 'parent' FROM sunish su, anan an
        UNION ALL SELECT sh.id, an.id, 'parent' FROM shiny_sunish sh, anan an
        UNION ALL SELECT kc.id, md.id, 'spouse' FROM kochurani kc, madhu md
        UNION ALL SELECT kc.id, rb.id, 'parent' FROM kochurani kc, reubin rb
        UNION ALL SELECT md.id, rb.id, 'parent' FROM madhu md, reubin rb
        UNION ALL SELECT kc.id, rk.id, 'parent' FROM kochurani kc, roshen_kadupil rk
        UNION ALL SELECT md.id, rk.id, 'parent' FROM madhu md, roshen_kadupil rk
        UNION ALL SELECT sn.id, sb.id, 'spouse' FROM suni sn, sebastin_ratheesh sb
        UNION ALL SELECT sn.id, rh.id, 'parent' FROM suni sn, rohan rh
        UNION ALL SELECT sb.id, rh.id, 'parent' FROM sebastin_ratheesh sb, rohan rh
        UNION ALL SELECT sn.id, nh.id, 'parent' FROM suni sn, nohan nh
        UNION ALL SELECT sb.id, nh.id, 'parent' FROM sebastin_ratheesh sb, nohan nh
        UNION ALL SELECT av.id, bc.id, 'spouse' FROM annama_vakathanam av, babychan bc
        UNION ALL SELECT av.id, ab.id, 'parent' FROM annama_vakathanam av, abin ab
        UNION ALL SELECT bc.id, ab.id, 'parent' FROM babychan bc, abin ab
        UNION ALL SELECT av.id, bl.id, 'parent' FROM annama_vakathanam av, blessen bl
        UNION ALL SELECT bc.id, bl.id, 'parent' FROM babychan bc, blessen bl
        UNION ALL SELECT ab.id, sj.id, 'spouse' FROM abin ab, sanuja sj
        UNION ALL SELECT bl.id, ln.id, 'spouse' FROM blessen bl, linu ln
        UNION ALL SELECT ph.id, lz.id, 'spouse' FROM philip_abraham ph, lizzy lz
        UNION ALL SELECT ph.id, pr.id, 'parent' FROM philip_abraham ph, priya pr
        UNION ALL SELECT lz.id, pr.id, 'parent' FROM lizzy lz, priya pr
        UNION ALL SELECT ph.id, pm.id, 'parent' FROM philip_abraham ph, philemon pm
        UNION ALL SELECT lz.id, pm.id, 'parent' FROM lizzy lz, philemon pm
        UNION ALL SELECT pr.id, al.id, 'spouse' FROM priya pr, alan al
        UNION ALL SELECT pr.id, dv.id, 'parent' FROM priya pr, david dv
        UNION ALL SELECT al.id, dv.id, 'parent' FROM alan al, david dv
        UNION ALL SELECT pr.id, gi.id, 'parent' FROM priya pr, gia gi
        UNION ALL SELECT al.id, gi.id, 'parent' FROM alan al, gia gi
        UNION ALL SELECT pr.id, di.id, 'parent' FROM priya pr, dia di
        UNION ALL SELECT al.id, di.id, 'parent' FROM alan al, dia di
        UNION ALL SELECT pm.id, so.id, 'spouse' FROM philemon pm, sonia so
        UNION ALL SELECT pm.id, iv.id, 'parent' FROM philemon pm, ivan iv
        UNION ALL SELECT so.id, iv.id, 'parent' FROM sonia so, ivan iv
        UNION ALL SELECT pm.id, rc.id, 'parent' FROM philemon pm, rachel rc
        UNION ALL SELECT so.id, rc.id, 'parent' FROM sonia so, rachel rc
        UNION ALL SELECT pm.id, sp.id, 'parent' FROM philemon pm, sam_philemon_child sp
        UNION ALL SELECT so.id, sp.id, 'parent' FROM sonia so, sam_philemon_child sp
        UNION ALL SELECT tb.id, ci.id, 'spouse' FROM thamban tb, cinni ci
        UNION ALL SELECT tb.id, sw.id, 'parent' FROM thamban tb, swetha sw
        UNION ALL SELECT ci.id, sw.id, 'parent' FROM cinni ci, swetha sw
        UNION ALL SELECT tb.id, sm.id, 'parent' FROM thamban tb, summitha sm
        UNION ALL SELECT ci.id, sm.id, 'parent' FROM cinni ci, summitha sm
        UNION ALL SELECT sw.id, bs.id, 'spouse' FROM swetha sw, bibin_swetha_spouse bs
        RETURNING id
    )
SELECT COUNT(*)::int FROM rels;
