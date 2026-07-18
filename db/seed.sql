-- Lenders
INSERT INTO lenders (institution,type,total_commitment,active_deals,status,region,rating,contact,email,phone,onboarded,address,aum,deals,notes) VALUES
('JP Morgan Chase','Bulge Bracket',1450,12,'Active','Americas','A+','Sarah Mitchell','s.mitchell@jpmc.com','+1 212 270 6000','2019-01-15','383 Madison Avenue, New York, NY 10017',3800000,ARRAY['DL-2024-001','DL-2024-002','DL-2024-004'],'Preferred bookrunner partner. Strong appetite for LBO financing.'),
('Goldman Sachs','Bulge Bracket',1120,9,'Active','Americas','A+','David Park','d.park@gs.com','+1 212 902 1000','2019-03-22','200 West Street, New York, NY 10282',2800000,ARRAY['DL-2024-001','DL-2024-005'],'High-yield specialist. Active in leveraged finance.'),
('BlackRock','Asset Manager',880,15,'Active','Americas','AA-','Lisa Chen','l.chen@blackrock.com','+1 212 810 5300','2020-06-10','50 Hudson Yards, New York, NY 10001',10000000,ARRAY['DL-2024-001','DL-2024-002','DL-2024-004','DL-2024-005'],'Largest asset manager globally. Conservative credit approach.'),
('Barclays','European Bank',760,11,'Active','EMEA','A','James Whitfield','j.whitfield@barclays.com','+44 20 7116 1000','2019-09-05','1 Churchill Place, London E14 5HP, UK',1500000,ARRAY['DL-2024-001','DL-2024-003'],'Strong EMEA presence. Cross-border deal expertise.'),
('PIMCO','Asset Manager',640,8,'Active','Americas','AA','Robert Torres','r.torres@pimco.com','+1 949 720 6000','2020-02-18','650 Newport Center Drive, Newport Beach, CA 92660',1900000,ARRAY['DL-2024-002','DL-2024-004'],'Fixed income focus. Active in investment-grade syndications.'),
('Ares Management','Credit Fund',590,6,'Active','Americas','BBB+','Amanda Ross','a.ross@aresmgmt.com','+1 310 201 4100','2021-04-11','2000 Avenue of the Stars, Los Angeles, CA 90067',450000,ARRAY['DL-2024-001','DL-2024-004'],'Alternative credit specialist. High-yield and distressed focus.'),
('Deutsche Bank','European Bank',520,7,'Active','EMEA','A-','Klaus Weber','k.weber@db.com','+49 69 910 00','2020-08-30','Taunusanlage 12, 60325 Frankfurt, Germany',1400000,ARRAY['DL-2024-003','DL-2024-005'],'Strong in European leveraged finance. Energy sector expertise.'),
('Mizuho Financial','Japanese Bank',430,5,'Active','APAC','A','Kenji Tanaka','k.tanaka@mizuho.com','+81 3 3596 1111','2021-01-20','1-5-5 Otemachi, Chiyoda-ku, Tokyo 100-8176',1800000,ARRAY['DL-2024-002'],'APAC gateway. Cross-currency deal capability.'),
('Apollo Global','Credit Fund',380,4,'Active','Americas','BBB','Michael Ford','m.ford@apollo.com','+1 212 515 3200','2022-03-07','9 West 57th Street, New York, NY 10019',600000,ARRAY['DL-2024-001'],'Private credit leader. Flexible on covenants.'),
('UBS Group','European Bank',310,3,'On Hold','EMEA','A','Sophie Laurent','s.laurent@ubs.com','+41 44 234 1111','2021-11-14','Bahnhofstrasse 45, 8001 Zurich, Switzerland',1600000,ARRAY['DL-2023-089'],'On hold pending internal credit review. Wealth management overlap.');

-- Deals
INSERT INTO deals (id,name,borrower,type,size,currency,status,role,closing_date,spread,maturity,participants,sector) VALUES
('DL-2024-001','Acme Corp Term Loan B','Acme Corporation','Term Loan B',1200,'USD','Active','Bookrunner','2024-03-15','SOFR + 325bps','2031-03-15',18,'Industrials'),
('DL-2024-002','TechGiant Inc Revolving Credit','TechGiant Inc.','Revolving Credit Facility',500,'USD','Active','Lead Left','2024-02-28','SOFR + 175bps','2029-02-28',12,'Technology'),
('DL-2024-003','GlobalEnergy Bridge Loan','GlobalEnergy Partners','Bridge Loan',750,'USD','Syndication','Arranger','2024-04-10','SOFR + 450bps','2025-10-10',7,'Energy'),
('DL-2023-089','MetroBank Sub Debt','MetroBank NA','Subordinated Debt',300,'USD','Closed','Participant','2023-11-20','SOFR + 280bps','2030-11-20',9,'Financial Services'),
('DL-2024-004','RetailCo LBO Financing','RetailCo Holdings','LBO Financing',2100,'USD','Active','Bookrunner','2024-01-31','SOFR + 400bps','2031-01-31',24,'Consumer Retail'),
('DL-2024-005','MedGroup Acquisition Finance','MedGroup International','Acquisition Finance',850,'USD','Pending','Lead Left','2024-05-01','SOFR + 350bps','2031-05-01',0,'Healthcare');

-- Documents
INSERT INTO documents (deal_id,name,type,size,uploaded,uploaded_by,status,restricted) VALUES
('DL-2024-001','Credit Agreement - Execution Version','Credit Agreement','2.4 MB','2024-03-14','S. Mitchell','Final',false),
('DL-2024-001','Term Sheet v3 - Final','Term Sheet','380 KB','2024-02-20','D. Park','Final',false),
('DL-2024-001','Confidential Information Memorandum','CIM','8.1 MB','2024-02-01','S. Mitchell','Final',true),
('DL-2024-001','Lender Presentation - February 2024','Presentation','5.6 MB','2024-02-05','Admin','Final',false),
('DL-2024-001','Financial Model - Q4 2023 Actuals','Financial Model','1.9 MB','2024-02-10','D. Park','Final',true),
('DL-2024-001','Environmental & Social Report','Due Diligence','3.2 MB','2024-02-25','Admin','Final',false),
('DL-2024-001','Amendment No. 1 - Draft','Amendment','420 KB','2024-03-20','S. Mitchell','Draft',false);

-- Amendments
INSERT INTO amendments (id,deal_id,title,status,deadline,votes_for,votes_against,votes_abstain,total_lenders,description) VALUES
('AMD-001','DL-2024-001','Amendment No. 1 — EBITDA Definition Update','Voting Open','2024-04-05',14,1,0,18,'Amends the definition of Consolidated EBITDA to include pro forma adjustments for acquisitions completed in the prior 12 months.'),
('AMD-002','DL-2024-002','Amendment No. 1 — Extension of Maturity','Approved','2024-01-15',12,0,0,12,'Extends the maturity date of the Revolving Credit Facility by 12 months to February 28, 2030.');
