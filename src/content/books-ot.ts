import type { BookOverview } from "./types.ts";

export const OT_OVERVIEWS: Record<string, BookOverview> = {
  Gen: {
    author:
      "The author is not named in the text; readers through the centuries have credited Moses, and many still do, while some scholars understand the book as reaching its present shape over time.",
    setting:
      "The opening chapters sit in no named time or place, and the family stories that follow move from Mesopotamia to Canaan and finally to Egypt, in a period the Bible places long before the kingdoms of Israel.",
    summary:
      "Genesis tells of the world's beginning and of the family God calls out of one city into a land of promise. It moves from Adam and Eve through Noah and the flood to Abraham, Isaac, Jacob and Joseph. It ends with Jacob's family safe but settled in Egypt, setting the stage for Exodus.",
    themes: [
      "God creates and blesses",
      "Human waywardness and mercy",
      "A family chosen for all nations",
      "Promises passed down the generations",
    ],
    outline: [
      ["1-11", "Beginnings: creation, flood, nations"],
      ["12-25", "Abraham called and tested"],
      ["26-36", "Isaac, Jacob and Esau"],
      ["37-50", "Joseph and the move to Egypt"],
    ],
    keyPassages: ["Gen 1:1-3", "Gen 12:1-3", "Gen 22:1-19", "Gen 50:15-21"],
  },
  Exod: {
    author:
      "Traditionally attributed to Moses, who stands at the center of the story, though many scholars understand the book to have taken shape over time.",
    setting:
      "The story is set in Egypt and in the wilderness region between Egypt and Canaan, in the period the Bible describes as Israel's slavery and escape, before the later settlement of the land.",
    summary:
      "Exodus tells how Israel escapes slavery in Egypt under Moses' leadership. At Mount Sinai God gives the people a covenant, commandments and the plan for a tented sanctuary. The book follows a young nation learning to live as the community of the God who freed them.",
    themes: [
      "God hears the cry of the oppressed",
      "Rescue and covenant",
      "Law for a free people",
      "God's presence with his people",
    ],
    outline: [
      ["1-15", "From slavery to the sea"],
      ["16-18", "Journey to Sinai"],
      ["19-24", "Covenant and commandments"],
      ["25-31", "Plans for the sanctuary"],
      ["32-34", "The golden calf and renewal"],
      ["35-40", "Building the sanctuary"],
    ],
    keyPassages: ["Exod 3:13-15", "Exod 14:21-22", "Exod 20:1-17", "Exod 34:6-7"],
  },
  Lev: {
    author:
      "Traditionally attributed to Moses, as the rest of the Torah is, though many scholars understand the book to have grown over time.",
    setting:
      "The setting is Mount Sinai, where Israel camps after leaving Egypt, and the book reads like a manual for the worship life of that camp.",
    summary:
      "Leviticus collects the rituals and laws that shaped Israel's worship. It sets out offerings, the work of priests, rules for clean and unclean, and the annual day of atonement. Its best known line calls the people to be holy because God is holy.",
    themes: [
      "Holiness in daily life",
      "Atonement and forgiveness",
      "Worship with order",
      "Care for neighbor and land",
    ],
    outline: [
      ["1-7", "Offerings and sacrifices"],
      ["8-10", "Priests begin their service"],
      ["11-15", "Clean and unclean"],
      ["16", "The day of atonement"],
      ["17-27", "The holiness code and festivals"],
    ],
    keyPassages: ["Lev 16", "Lev 19:1-18", "Lev 26:3-13"],
  },
  Num: {
    author:
      "Traditionally attributed to Moses, as the rest of the Torah is, though many scholars understand the book to have taken shape over time.",
    setting:
      "The book follows Israel through the wilderness between Egypt and Canaan, from Mount Sinai to the plains of Moab, across roughly a generation of travel.",
    summary:
      "Numbers mixes census lists, laws and vivid stories of travel and complaint. The people set out for the promised land, lose heart at its border, and wander until a new generation has grown up. It ends with that generation camped and ready to cross the Jordan.",
    themes: [
      "God's patience with a grumbling people",
      "Faith and fear at the border",
      "Leadership under pressure",
      "Guidance for the journey",
    ],
    outline: [
      ["1-4", "Preparations at Sinai"],
      ["5-10", "Laws, worship and the first departure"],
      ["11-20", "Rebellion and wandering"],
      ["21-25", "Journey north and Balaam"],
      ["26-36", "A new census and new plans"],
    ],
    keyPassages: ["Num 6:24-26", "Num 13:25-33", "Num 21:4-9", "Num 24:15-19"],
  },
  Deut: {
    author:
      "Traditionally attributed to Moses, whose farewell speeches fill the book, though many scholars understand it to have reached its present form over time.",
    setting:
      "The book is set on the plains of Moab, east of the Jordan river, as Israel stands ready to enter Canaan without Moses.",
    summary:
      "Deuteronomy presents Moses' final speeches before the people enter the land. He retells the wilderness years, restates the law, and calls Israel to love and obey God with whole hearts. The book reads as a covenant renewal for a new generation.",
    themes: [
      "Love God with all your heart",
      "Remember and do not forget",
      "Blessing and curse",
      "A covenant for the next generation",
    ],
    outline: [
      ["1-3", "Looking back at the journey"],
      ["4-11", "The great command and its warnings"],
      ["12-26", "The law restated"],
      ["27-30", "Blessings and curses"],
      ["31-34", "Joshua commissioned and Moses' farewell"],
    ],
    keyPassages: ["Deut 6:4-9", "Deut 30:15-20", "Deut 34:1-12"],
  },
  Josh: {
    author:
      "Traditionally attributed to Joshua himself in older tradition, though the book does not name its writer and reports his death, and many scholars understand it as a later work.",
    setting:
      "The events sit in the land of Canaan, in the period the Bible describes as Israel's entry into the land after the wilderness years.",
    summary:
      "Joshua tells of crossing the Jordan, the fall of Jericho and the campaigns that follow as Israel takes the land. The middle of the book divides the territory among the tribes. It closes with Joshua calling the people to renew their commitment to God.",
    themes: [
      "God keeps the promise of land",
      "Courage rooted in trust",
      "Obedience and its limits",
      "Choosing to serve the Lord",
    ],
    outline: [
      ["1-5", "Entering the land"],
      ["6-12", "The campaigns"],
      ["13-21", "Dividing the land"],
      ["22-24", "Farewell and covenant"],
    ],
    keyPassages: ["Josh 1:1-9", "Josh 2", "Josh 6", "Josh 24:14-15"],
  },
  Judg: {
    author:
      "The author is not named in the text; later tradition credited Samuel, and some readers have agreed, while many scholars date the book later.",
    setting:
      "The book is set in Canaan between the death of Joshua and the rise of kings, a time the text itself describes as days when Israel had no king.",
    summary:
      "Judges collects stories of leaders raised up to rescue Israel after rounds of unfaithfulness and trouble. The rescuers are a mixed crew, from Deborah and Gideon to Jephthah and Samson. As the book goes on the cycles grow darker and the people grow more lawless.",
    themes: [
      "Rescue repeated, lessons unlearned",
      "Everyone doing what seems right to them",
      "God uses unlikely people",
      "The need for a better way",
    ],
    outline: [
      ["1-2", "After Joshua"],
      ["3-16", "The judges and their rescues"],
      ["17-18", "Micah's idol and Dan's migration"],
      ["19-21", "A crime and a civil war"],
    ],
    keyPassages: ["Judg 2:16-19", "Judg 6:11-24", "Judg 16", "Judg 21:25"],
  },
  Ruth: {
    author:
      "The author is not named in the text, and tradition supplies no certain name for the storyteller.",
    setting:
      "The story takes place in Bethlehem and the surrounding countryside of Judah in the days when judges ruled, told with the warmth of village harvest life.",
    summary:
      "Ruth follows a Moabite widow who leaves her homeland to stay with her Israelite mother in law, Naomi. Gleaning in the fields, she meets Boaz, who acts as her family's redeemer. The book ends with a marriage and a family line that leads to David.",
    themes: [
      "Loyal love",
      "The outsider welcomed in",
      "Redemption of the bereaved",
      "Quiet providence",
    ],
    outline: [
      ["1", "Loss and the road home"],
      ["2", "Gleaning in Boaz's field"],
      ["3", "A request at the threshing floor"],
      ["4", "Redemption and a royal family"],
    ],
    keyPassages: ["Ruth 1:16-17", "Ruth 2", "Ruth 4:13-17"],
  },
  "1Sam": {
    author:
      "The author is not named in the text; the books draw on earlier writings, and later Jewish tradition credited Samuel, though the story continues past his death.",
    setting:
      "The story runs from Israel's hill country to the royal court, in the period when tribal life under the judges gave way to the founding of the monarchy.",
    summary:
      "First Samuel follows Samuel, the last of the judges, as Israel demands and receives a king. Saul begins well and ends badly, while the young David rises in fame and favor. The book tracks the slow decline of Saul and the growth of David's fortunes.",
    themes: [
      "God looks at the heart",
      "The cost of wanting a king",
      "Rivalry and restraint",
      "Anointing and its long road",
    ],
    outline: [
      ["1-7", "Samuel's birth and ministry"],
      ["8-15", "The people ask for a king"],
      ["16-24", "David rises as Saul declines"],
      ["25-31", "Saul's last years and death"],
    ],
    keyPassages: ["1Sam 2:1-10", "1Sam 3", "1Sam 16:1-13", "1Sam 17", "1Sam 24"],
  },
  "2Sam": {
    author:
      "The author is not named in the text; the books draw on earlier writings, and later tradition again pointed to Samuel and the prophets who followed him.",
    setting:
      "The story centers on Jerusalem and the court of David, in the early decades of the united kingdom of Israel.",
    summary:
      "Second Samuel follows David's reign from triumph to trouble. It records his victories, God's covenant promise to his house, and his kindness, then his adultery with Bathsheba and the revolt of his son Absalom. The book refuses to idealize the king, showing both his greatness and his failures.",
    themes: [
      "A promise to David's house",
      "Sin and its consequences",
      "Mercy in the royal line",
      "Lament for a son",
    ],
    outline: [
      ["1-4", "David becomes king"],
      ["5-10", "Jerusalem and the victories"],
      ["11-12", "Sin and confrontation"],
      ["13-20", "Trouble in the family"],
      ["21-24", "Songs, warriors and a census"],
    ],
    keyPassages: ["2Sam 7", "2Sam 11", "2Sam 12:1-7", "2Sam 22:2-4"],
  },
  "1Kgs": {
    author:
      "The author is not named; the books cite earlier records such as the annals of the kings, and later tradition credited the prophet Jeremiah.",
    setting:
      "The book spans the last years of the united kingdom and the divided kingdoms that followed, with scenes in Jerusalem, Samaria and the surrounding nations.",
    summary:
      "First Kings begins with Solomon's wise and wealthy reign and the building of the temple. After his death the kingdom splits into Israel and Judah. The rest of the book follows the two royal lines and the prophets who confronted them, above all Elijah.",
    themes: [
      "Wisdom and its misuse",
      "A house for God's name",
      "A kingdom divided",
      "Prophets who confront power",
    ],
    outline: [
      ["1-2", "Solomon established as king"],
      ["3-11", "Solomon's wisdom, temple and decline"],
      ["12-16", "The kingdom splits"],
      ["17-22", "Elijah and Ahab"],
    ],
    keyPassages: ["1Kgs 3:5-14", "1Kgs 8:22-53", "1Kgs 18", "1Kgs 19:9-18"],
  },
  "2Kgs": {
    author:
      "The author is not named; like First Kings it cites court records, and later tradition also credited the prophet Jeremiah.",
    setting:
      "The book covers the final centuries of the two kingdoms, from the passing of Elijah to the fall of Jerusalem and the exile to Babylon.",
    summary:
      "Second Kings follows the long line of rulers in Israel and Judah, with Elisha and other prophets working among them. The northern kingdom falls to Assyria, and the south survives until Jerusalem is taken and the temple destroyed. The book reads the collapse as the fruit of long unfaithfulness, while keeping a spark of hope alive.",
    themes: [
      "The patient warnings of the prophets",
      "Exile as judgment",
      "Reform that comes too late",
      "Hope surviving catastrophe",
    ],
    outline: [
      ["1-2", "Elijah taken up"],
      ["3-8", "Elisha's ministry"],
      ["9-17", "The north unravels and falls"],
      ["18-25", "Judah to the brink and into exile"],
    ],
    keyPassages: ["2Kgs 2:1-12", "2Kgs 5", "2Kgs 19:14-19", "2Kgs 23:1-3"],
  },
  "1Chr": {
    author:
      "The author is not named; the books share language and outlook with Ezra and Nehemiah, and tradition has often pointed to Ezra, though this remains debated.",
    setting:
      "The book retells Israel's story from Adam to King David, written for a community back in the land after the exile, with Jerusalem's worship at the center.",
    summary:
      "First Chronicles opens with long genealogies that place the restored community in the stream of Israel's history. It then turns to David's reign, passing over Saul almost entirely. The closing chapters fill with David's preparations for the temple and his ordering of its worship.",
    themes: [
      "Roots and belonging",
      "Worship at the center",
      "A king after God's heart",
      "Passing the torch to the next generation",
    ],
    outline: [
      ["1-9", "The family lines of Israel"],
      ["10-12", "David made king"],
      ["13-20", "The ark, the victories and the reign"],
      ["21-27", "Census, temple plans and duties"],
      ["28-29", "The charge to Solomon"],
    ],
    keyPassages: ["1Chr 16:8-36", "1Chr 17:16-27", "1Chr 28:1-10"],
  },
  "2Chr": {
    author:
      "The author is not named; the book continues the outlook of First Chronicles, and tradition has often pointed to Ezra here as well.",
    setting:
      "The book retells the story of Judah from Solomon's reign to the exile, addressed to the community that returned to Jerusalem from Babylon.",
    summary:
      "Second Chronicles begins with Solomon's temple and the height of Judah's glory. It then tracks king after king, weighing each by loyalty to God and the temple. Revivals under leaders such as Hezekiah and Josiah punctuate the decline, and though it ends in exile, the last verses hint at a way home.",
    themes: [
      "When the king honors God",
      "Revival and backsliding",
      "The temple as the heart of the nation",
      "Hope beyond exile",
    ],
    outline: [
      ["1-9", "Solomon and the temple"],
      ["10-20", "From division to revival"],
      ["21-32", "Kings between decline and reform"],
      ["33-36", "Last reforms, exile and a hint of home"],
    ],
    keyPassages: ["2Chr 7:12-16", "2Chr 20:5-12", "2Chr 34:14-21"],
  },
  Ezra: {
    author:
      "The author is not named; the book shares its outlook and language with Chronicles, and tradition has often pointed to Ezra, who appears in its second half.",
    setting:
      "The book is set in the Persian period, among Judeans returning from Babylon to Jerusalem and Judah under an edict of Cyrus.",
    summary:
      "Ezra tells of exiles coming home to rebuild the temple, and of the local opposition that slows the work for years. After the temple is finished, the priest Ezra arrives to teach the law and call the people to renewed faithfulness, including difficult reforms around marriage. It is a book about a small community sorting out its identity.",
    themes: [
      "Coming home",
      "Rebuilding worship",
      "The book of the law",
      "A community sorting out its identity",
    ],
    outline: [
      ["1-2", "The way home opened"],
      ["3-6", "The altar and the rebuilt temple"],
      ["7-8", "Ezra's return"],
      ["9-10", "Confession and reform"],
    ],
    keyPassages: ["Ezra 1:1-4", "Ezra 3:8-13", "Ezra 9:6-15"],
  },
  Neh: {
    author:
      "The author is not named; long sections read as Nehemiah's own first person account, gathered with other records, and tradition long credited the combined work to Ezra.",
    setting:
      "The book belongs to the Persian period, in Jerusalem and its surrounding villages, in the decades after the first returns from exile.",
    summary:
      "Nehemiah, a Jew serving the Persian king, hears of Jerusalem's broken walls and persuades the court to send him home. Under his leadership the people rebuild the wall despite mockery and threats. The second half turns to the public reading of the law, confession and covenant renewal.",
    themes: [
      "Prayer and planning together",
      "Rebuilding against opposition",
      "The joy of the Lord",
      "Covenant renewed",
    ],
    outline: [
      ["1-2", "Nehemiah's call"],
      ["3-6", "The wall rebuilt"],
      ["7", "The people counted"],
      ["8-10", "The law read and the covenant signed"],
      ["11-13", "Settling the city and later reforms"],
    ],
    keyPassages: ["Neh 1:4-11", "Neh 6:15-16", "Neh 8:1-12"],
  },
  Esth: {
    author:
      "The author is not named in the text, and tradition supplies no reliable name; the story shows close knowledge of the Persian court.",
    setting:
      "The story unfolds in the Persian royal city of Susa, among the Jewish community living scattered among the nations.",
    summary:
      "Esther, a young Jewish woman, becomes queen of Persia without revealing her people. When the scheming Haman plots to destroy the Jews, her cousin Mordecai urges her to risk her life to intervene. Through a chain of reversals the plot collapses, and the book ends with the festival of Purim.",
    themes: [
      "Courage at the right moment",
      "Reversals of fortune",
      "Hidden providence",
      "Deliverance remembered",
    ],
    outline: [
      ["1-2", "A new queen"],
      ["3-5", "A plot and a plea"],
      ["6-9", "Reversal and deliverance"],
      ["10", "Mordecai's rise"],
    ],
    keyPassages: ["Esth 4:13-14", "Esth 7", "Esth 9:20-28"],
  },
  Job: {
    author:
      "The author is not named in the text, and tradition offers no reliable name; the book's depth has kept readers guessing for centuries.",
    setting:
      "The story is set in the land of Uz, outside Israel, in a legendary past; its world is a courtyard of flocks, servants and visiting friends.",
    summary:
      "Job, a good man, loses everything and spends most of the book arguing with friends who insist that suffering must punish sin. He demands a hearing from God, and God finally answers from a whirlwind. The book refuses easy answers about suffering while honoring Job's honesty.",
    themes: [
      "Suffering without easy answers",
      "God beyond human reckoning",
      "Comfort that wounds",
      "Integrity in the dark",
    ],
    outline: [
      ["1-2", "Job tested"],
      ["3-31", "Job and his three friends"],
      ["32-37", "Elihu speaks"],
      ["38-41", "God answers"],
      ["42", "Job humbled and restored"],
    ],
    keyPassages: ["Job 1:20-22", "Job 19:23-27", "Job 38:1-11", "Job 42:1-6"],
  },
  Ps: {
    author:
      "Traditionally attributed largely to David, whom many psalm titles name, along with Asaph, the sons of Korah, Solomon and others; the collection grew over a long time and has no single author.",
    setting:
      "The psalms arise from the worship and daily life of ancient Israel, from temple liturgy to personal prayer, gathered into a songbook used across the centuries.",
    summary:
      "Psalms is the prayer and praise book of God's people. Its 150 poems run from praise and thanks to lament, anger, confession and trust. Readers have long used them as words for every mood before God.",
    themes: [
      "Honest prayer in every mood",
      "Praise that refuses circumstances",
      "Trust in the shepherd God",
      "The Lord reigns",
      "Delight in the law",
    ],
    outline: [
      ["1-41", "The first book of psalms"],
      ["42-72", "The second book of psalms"],
      ["73-89", "The third book of psalms"],
      ["90-106", "The fourth book of psalms"],
      ["107-150", "The fifth book of psalms"],
    ],
    keyPassages: ["Ps 1", "Ps 23", "Ps 51", "Ps 103", "Ps 139"],
  },
  Prov: {
    author:
      "Traditionally attributed largely to Solomon, and several sections are introduced as his, though the book itself also names the wise, Agur and King Lemuel as contributors.",
    setting:
      "The sayings arise from the homes and courts of ancient Israel and the wider Near East, collected for training young people in wise living.",
    summary:
      "Proverbs gathers short, sharp sayings about real life: work, words, money, friendship and desire. The long opening poems personify wisdom as a woman calling in the streets. Its recurring claim is that reverence for God is where wisdom starts.",
    themes: [
      "Reverence for God as wisdom's start",
      "Words that heal or harm",
      "Diligence and laziness",
      "Wisdom personified",
      "Humility over pride",
    ],
    outline: [
      ["1-9", "Wisdom's call"],
      ["10-15", "Sayings of Solomon"],
      ["16-22", "Sayings for kings and common life"],
      ["23-29", "Further collections"],
      ["30-31", "The words of Agur and of Lemuel's mother"],
    ],
    keyPassages: ["Prov 1:1-7", "Prov 3:5-6", "Prov 8:1-11", "Prov 31:10-31"],
  },
  Eccl: {
    author:
      "Traditionally attributed to Solomon, reading the speaker's claim to be a son of David as pointing to him, though he calls himself only the Teacher, and many scholars date the book later.",
    setting:
      "The voice is that of an aged, world weary sage in ancient Israel, looking back over a lifetime of pleasure, work and observation.",
    summary:
      "Ecclesiastes asks what anything is worth under the sun. Its speaker tries wisdom, pleasure and work, and finds each fleeting. Yet the book keeps pointing to God as the giver of each day, and it ends by summing up life as reverence and obedience.",
    themes: [
      "Life's brevity and mystery",
      "Vapor under the sun",
      "Receive the day as a gift",
      "Reverence as the conclusion",
    ],
    outline: [
      ["1-2", "The Teacher's experiment"],
      ["3-6", "Observations on time and toil"],
      ["7-10", "Wisdom for an unclear world"],
      ["11-12", "Final counsel: remember your Creator"],
    ],
    keyPassages: ["Eccl 1:1-11", "Eccl 3:1-8", "Eccl 12:9-14"],
  },
  Song: {
    author:
      "Traditionally attributed to Solomon, whose name appears in the poems, though no author is named and many readers view the book as a collection of love songs gathered over time.",
    setting:
      "The poems move through gardens, vineyards and hills in ancient Israel, in the world of courtship and married delight.",
    summary:
      "Song of Songs is a cycle of love poems exchanged between a woman and the man she loves, with friends chiming in. It celebrates desire, beauty and fidelity in plain, sensory language. Readers have long also heard in it a picture of love between God and his people.",
    themes: [
      "Love as strong as death",
      "Delight in the beloved",
      "Seasons of longing and meeting",
      "Do not stir love before its time",
    ],
    outline: [
      ["1-2", "Longing and praise"],
      ["3-4", "A dream, a procession and a wedding"],
      ["5-6", "A quarrel and renewed delight"],
      ["7-8", "Growing love and a vow"],
    ],
    keyPassages: ["Song 2:10-13", "Song 4:1-7", "Song 8:6-7"],
  },
  Isa: {
    author:
      "Traditionally attributed to the prophet Isaiah of Jerusalem; the book gathers material from many decades, and many scholars understand the later chapters to come from his followers, a view other readers do not share.",
    setting:
      "The book's world runs from Jerusalem in the eighth century, shaken by Assyria, to a later community facing Babylon, with visions reaching to the renewal of all things.",
    summary:
      "Isaiah announces judgment on Judah and the nations, then comfort and restoration for a people judged enough. Central figures include the promised child, the suffering servant and the anointed bringer of good news. It is the longest of the prophets and among the most quoted.",
    themes: [
      "A holy God exalted",
      "Judgment and comfort",
      "Trust instead of alliances",
      "The servant who bears much",
      "Light for the nations",
    ],
    outline: [
      ["1-12", "Judah warned in Assyria's shadow"],
      ["13-27", "Oracles against the nations"],
      ["28-39", "Crisis and Hezekiah's trust"],
      ["40-55", "Comfort for exiles"],
      ["56-66", "A new community and final hope"],
    ],
    keyPassages: ["Isa 6:1-8", "Isa 40:28-31", "Isa 53", "Isa 61:1-3"],
  },
  Jer: {
    author:
      "Traditionally attributed to the prophet Jeremiah, with the scribe Baruch named as the one who wrote his words down, though many scholars see the book reaching final form over time.",
    setting:
      "The prophecies and stories belong to Judah's last decades before Jerusalem fell to Babylon, and to the scattering that followed.",
    summary:
      "Jeremiah is called as a young man and spends decades warning Judah of coming ruin. He is opposed and imprisoned, and he mourns the land's fate, yet he also promises a new covenant written on hearts. The book ends with oracles against the nations and a stark account of Jerusalem's fall.",
    themes: [
      "A reluctant prophet's faithfulness",
      "Tears before judgment",
      "A new covenant within reach",
      "Wounds and their healing",
    ],
    outline: [
      ["1-10", "Call and early warnings"],
      ["11-20", "Conflicts and laments"],
      ["21-29", "Kings, false prophets and a letter to exiles"],
      ["30-33", "Promises of restoration"],
      ["34-45", "The final years of Jerusalem"],
      ["46-51", "Oracles against the nations"],
      ["52", "The fall of Jerusalem"],
    ],
    keyPassages: ["Jer 1:4-10", "Jer 29:10-14", "Jer 31:31-34"],
  },
  Lam: {
    author:
      "The author is not named in the text; later tradition attributed the book to Jeremiah, and some readers still hold that view.",
    setting:
      "The poems arise from Jerusalem in the aftermath of its destruction, with the city ruined and its people killed, exiled or starving.",
    summary:
      "Lamentations is five poems of grief over the wreck of Jerusalem. They describe the horror honestly and ask who can comfort the city, yet they recall that God's mercies are new every morning. The book teaches readers how to mourn without letting go of hope.",
    themes: [
      "Grief poured out in full",
      "The steadfast love of the Lord",
      "Honest sorrow before God",
      "Waiting for morning",
    ],
    outline: [
      ["1", "A widowed city"],
      ["2", "The Lord's anger and the city's tears"],
      ["3", "Hope inside the grief"],
      ["4", "The horror deepens"],
      ["5", "A plea for restoration"],
    ],
    keyPassages: ["Lam 1:1-5", "Lam 3:19-33", "Lam 5:19-22"],
  },
  Ezek: {
    author:
      "Traditionally attributed to the prophet Ezekiel, a priest exiled in Babylon in whose name the whole book speaks; it is often counted among the most unified of the prophets.",
    setting:
      "Ezekiel speaks from among the Judean exiles in Babylon, by the Kebar river, before and after the fall of Jerusalem.",
    summary:
      "Ezekiel uses strange visions and street theater to warn the exiles that Jerusalem will indeed fall. Once it does, his message turns to hope: hearts of stone replaced with hearts of flesh, dry bones raised to life, and a new temple. The book is vivid, ordered and strange by design.",
    themes: [
      "The glory of the Lord",
      "Each soul answerable to God",
      "New hearts and new life",
      "A temple and a land restored",
    ],
    outline: [
      ["1-3", "Call and commission"],
      ["4-24", "Jerusalem's fall dramatized"],
      ["25-32", "Oracles against the nations"],
      ["33-39", "Watchman, shepherd and dry bones"],
      ["40-48", "The new temple and the land"],
    ],
    keyPassages: ["Ezek 1:4-28", "Ezek 18:30-32", "Ezek 36:24-28", "Ezek 37:1-14"],
  },
  Dan: {
    author:
      "Traditionally attributed to Daniel, who stands at the center of the tales; many scholars date the final form later, while other readers keep to the traditional view.",
    setting:
      "The tales and visions are set in the courts of Babylon and Persia, among Judean exiles, with the visions pressing on toward the end of all empires.",
    summary:
      "Daniel and his friends keep faith in a foreign court, from the king's food to the lions' den. The second half turns to visions of rising and falling beasts and one like a son of man. The book encourages God's people to endure faithfully when the powers of the world oppose them.",
    themes: [
      "Faithful in a foreign court",
      "God rules the kingdoms",
      "Prayer whatever it costs",
      "A kingdom that will not pass away",
    ],
    outline: [
      ["1-3", "Training, the statue and the furnace"],
      ["4-6", "Two kings humbled and the lions"],
      ["7-9", "Beasts, a ram and seventy weeks"],
      ["10-12", "The final vision and the end"],
    ],
    keyPassages: ["Dan 1:8-16", "Dan 3", "Dan 6", "Dan 7:13-14", "Dan 12:1-3"],
  },
  Hos: {
    author:
      "Traditionally attributed to the prophet Hosea, in whose name the book speaks and whose marriage and children it recounts as signs for Israel.",
    setting:
      "Hosea preaches to the northern kingdom of Israel in its final generations, before Assyria swept it away.",
    summary:
      "God tells Hosea to marry Gomer, a woman who proves unfaithful, so the prophet's broken home pictures Israel's unfaithfulness to God. Chapters of accusation follow, naming misplaced trust and empty religion. The book ends with an appeal to return and with God's tender promise of healing.",
    themes: [
      "Love that will not let go",
      "Unfaithfulness named honestly",
      "Mercy stronger than judgment",
      "Return and be healed",
    ],
    outline: [
      ["1-3", "A marriage as a message"],
      ["4-7", "Charges against priest and people"],
      ["8-10", "The fruit of forgetting God"],
      ["11-14", "Love's last appeal"],
    ],
    keyPassages: ["Hos 2:14-20", "Hos 3", "Hos 11:1-4", "Hos 14:1-4"],
  },
  Joel: {
    author:
      "Traditionally attributed to the prophet Joel, named in the opening line as the son of Pethuel; nothing more is known of him, and even the book's period is debated.",
    setting:
      "The book names no kings and no datable events; its world is Jerusalem's temple and fields during a plague of locusts and drought, at a moment of crisis worship.",
    summary:
      "A locust swarm strips the land, and Joel reads it as a warning of the coming day of the Lord. He calls the whole people to gather, fast and return to God. God's answer is promised blessing, the outpoured Spirit, and a final reckoning in which Judah is spared.",
    themes: [
      "The day of the Lord",
      "Return with all your heart",
      "The Spirit poured out",
      "A valley of decision",
    ],
    outline: [
      ["1", "Locusts as warning"],
      ["2", "The day draws near"],
      ["3", "The nations judged, Judah restored"],
    ],
    keyPassages: ["Joel 1:1-12", "Joel 2:12-17", "Joel 2:28-32"],
  },
  Amos: {
    author:
      "Traditionally attributed to Amos, the herdsman and fig farmer from Tekoa whom the book itself describes; nothing else is known of him.",
    setting:
      "Amos speaks in the northern kingdom during a season of prosperity and expansion, when wealth sat alongside injustice, in the years before Assyria's rise.",
    summary:
      "A southern farmer turns up in the northern kingdom to announce judgment. Amos indicts the surrounding nations first, then Israel itself, for selling the poor and dressing up greed in religion. He warns of exile, yet closes with a promise that God will restore the fallen house of David.",
    themes: [
      "Justice rolling down",
      "Religion without justice",
      "Privilege breeds accountability",
      "A remnant restored",
    ],
    outline: [
      ["1-2", "Eight oracles, the last at home"],
      ["3-6", "Charges against the proud and secure"],
      ["7-8", "Visions of judgment"],
      ["9", "The Lord at the altar, and mercy at the end"],
    ],
    keyPassages: ["Amos 3:1-8", "Amos 5:21-24", "Amos 9:11-15"],
  },
  Obad: {
    author:
      "The author is not named beyond the single word Obadiah, a common name meaning servant of the Lord; nothing further is known of him.",
    setting:
      "The book addresses Edom, Judah's neighbor and kinsman to the southeast, in the aftermath of a disaster in Jerusalem, with the exact occasion debated.",
    summary:
      "Obadiah is the shortest book in the Old Testament, a single oracle against Edom. It condemns Edom for gloating over Jerusalem's fall and looting alongside its attackers. Pride will be brought down, the book says, while Mount Zion will be delivered and the kingdom made God's.",
    themes: [
      "Pride brought low",
      "Gloating repaid",
      "The day of the Lord",
      "Zion delivered",
    ],
    outline: [["1", "An oracle against Edom"]],
    keyPassages: ["Obad 1:1-9", "Obad 1:10-14", "Obad 1:15-21"],
  },
  Jonah: {
    author:
      "The author is not named in the text; the book tells the story of the prophet Jonah son of Amittai, whom the book of Kings also mentions, and nothing is known of the writer.",
    setting:
      "The story sends a Hebrew prophet to Nineveh, the great capital of Assyria, by way of the open sea and the belly of a great fish.",
    summary:
      "Jonah runs from God's call, is swallowed by a great fish, and prays his way back to obedience. His preaching works, Nineveh repents, and God spares the city. The book ends with Jonah angry at mercy and God asking whether he should not pity a great city.",
    themes: [
      "Running from a calling",
      "Mercy for the enemy",
      "Repentance heard",
      "A prophet's hard heart",
    ],
    outline: [
      ["1", "Flight and the fish"],
      ["2", "A prayer from the deep"],
      ["3", "Nineveh repents"],
      ["4", "Anger and a question"],
    ],
    keyPassages: ["Jonah 1", "Jonah 2", "Jonah 3", "Jonah 4:1-11"],
  },
  Mic: {
    author:
      "Traditionally attributed to the prophet Micah of Moresheth in Judah, whose preaching the book dates by the reigns of three kings; nothing more is known of him.",
    setting:
      "Micah preaches in Judah in the days of the kings named in the book's first verse, a period of Assyrian pressure and deep inequality at home.",
    summary:
      "Micah preaches against leaders who build palaces on the backs of the poor. He warns that judgment will come, even naming the fall of Jerusalem. Yet he also promises a ruler from Bethlehem, a day when swords are beaten into plows, and the famous call to do justice, love mercy and walk humbly with God.",
    themes: [
      "Justice for the poor",
      "Rulers judged",
      "A ruler from Bethlehem",
      "What the Lord requires",
      "Peace among the nations",
    ],
    outline: [
      ["1-2", "Judgment on the land and its powerful"],
      ["3", "The leaders indicted"],
      ["4-5", "Hope: Zion's future and a coming ruler"],
      ["6-7", "A lawsuit and a plea for pardon"],
    ],
    keyPassages: ["Mic 4:1-5", "Mic 5:2-5", "Mic 6:6-8", "Mic 7:18-20"],
  },
  Nah: {
    author:
      "Traditionally attributed to Nahum of Elkosh, named in the opening line; his hometown is unknown and nothing more survives about him.",
    setting:
      "The book is an oracle against Nineveh, capital of Assyria, in the years of Assyria's power and approaching collapse.",
    summary:
      "Nahum celebrates the fall of Nineveh, the empire that had crushed its neighbors for a century. It opens with a psalm on God's power and patience, then pictures the city's siege and ruin in vivid color. For Judah, worn down by Assyria, the message is good news: the oppressor will not last.",
    themes: [
      "God slow to anger",
      "The oppressor's day ends",
      "Good news for the oppressed",
      "The Lord as a stronghold",
    ],
    outline: [
      ["1", "A psalm of God's power"],
      ["2", "The attacker attacked"],
      ["3", "Woe to the city of blood"],
    ],
    keyPassages: ["Nah 1:2-7", "Nah 1:12-15", "Nah 3:1-7"],
  },
  Hab: {
    author:
      "Traditionally attributed to the prophet Habakkuk, named in the book's opening line; nothing further is known about him.",
    setting:
      "The prophet speaks in Judah in a time of violence and injustice at home, with the rise of the Babylonians looming over everything.",
    summary:
      "Habakkuk does what few prophets do: he argues with God. He asks why God tolerates injustice, and why the punishment will fall to the brutal Babylonians. God answers that the just will live by faithfulness, and the book closes with a psalm of trust that chooses joy even if the crops fail.",
    themes: [
      "Questioning God honestly",
      "The just shall live by faith",
      "Woe to the violent",
      "Joy when the fields are empty",
    ],
    outline: [
      ["1", "Complaints and the Babylonians"],
      ["2", "The answer and five woes"],
      ["3", "A psalm of trust"],
    ],
    keyPassages: ["Hab 1:2-4", "Hab 2:1-4", "Hab 3:17-19"],
  },
  Zeph: {
    author:
      "Traditionally attributed to the prophet Zephaniah, whose four generation family line opens the book; nothing else is known of him.",
    setting:
      "Zephaniah preaches in Judah in the days of King Josiah, before that king's reforms took hold, when the land still bristled with old and new idols.",
    summary:
      "Zephaniah announces a great day of the Lord coming on Judah and the nations. No class escapes the sweep of judgment, priest or prince, merchant or cynic. Yet the book turns at the end to a humble remnant and to a God who rejoices over his people with singing.",
    themes: [
      "The day of the Lord",
      "Judgment without favorites",
      "The humble remnant",
      "God who sings over his people",
    ],
    outline: [
      ["1", "The day against Judah"],
      ["2", "The day against the nations; seek the Lord"],
      ["3", "Jerusalem judged, then restored with singing"],
    ],
    keyPassages: ["Zeph 1:14-18", "Zeph 2:1-3", "Zeph 3:14-17"],
  },
  Hag: {
    author:
      "Traditionally attributed to the prophet Haggai, whose short dated messages anchor the book; nothing else is known of him.",
    setting:
      "Haggai speaks in Jerusalem in the early Persian period, a generation after the first return from exile, with the temple site still a heap of rubble.",
    summary:
      "The returned exiles have built comfortable homes while God's house sits in ruins. Haggai calls the community to rebuild, and they respond. He promises that the new temple's glory will surpass the old, and that God will shake the nations and bless his people.",
    themes: [
      "Put first things first",
      "Courage to rebuild",
      "God's presence renewed",
      "A greater glory promised",
    ],
    outline: [
      ["1", "The call to rebuild"],
      ["2", "Glory now and glory to come"],
    ],
    keyPassages: ["Hag 1:2-11", "Hag 2:1-9", "Hag 2:20-23"],
  },
  Zech: {
    author:
      "Traditionally attributed to the prophet Zechariah, whose dated visions run alongside Haggai's; many scholars see chapters nine to fourteen as added later, a view other readers do not share.",
    setting:
      "The visions belong to Jerusalem in the early Persian period, among returned exiles rebuilding the temple; the closing oracles look toward a troubled future for the land.",
    summary:
      "Zechariah pairs with Haggai in urging the rebuilding, but goes much further. Eight night visions, a crowning of the high priest and questions about fasting all carry one point: God is returning to dwell with his people. The final chapters turn to a humble king, a struck shepherd and a city at the center of the world's destiny.",
    themes: [
      "Return to me and I will return",
      "The high priest cleansed",
      "Not by might but by my Spirit",
      "A humble king, a wounded shepherd",
      "All nations streaming to Jerusalem",
    ],
    outline: [
      ["1-6", "Eight night visions"],
      ["7-8", "Fasting turned to blessing"],
      ["9-11", "Oracles of the king and the shepherd"],
      ["12-14", "Jerusalem at the end of days"],
    ],
    keyPassages: ["Zech 1:1-6", "Zech 4:1-6", "Zech 9:9-10", "Zech 14:1-9"],
  },
  Mal: {
    author:
      "The author is not named; Malachi may be a personal name or simply mean my messenger, and tradition supplies no reliable further detail.",
    setting:
      "Malachi speaks to the restored community in Judah in the Persian period, when the temple was running again but the people's devotion had gone slack.",
    summary:
      "Malachi records a running argument between God and his people in question and answer. The priests offer blemished animals, and the people weary of God and betray one another in marriage. Yet the book promises a messenger who will prepare the way, and it closes by pointing to the great day to come.",
    themes: [
      "God's love questioned and affirmed",
      "An offering worthy of the name",
      "Faithful in covenant marriage",
      "The messenger who prepares",
      "A day of healing and fire",
    ],
    outline: [
      ["1", "Love affirmed, blemished offerings faulted"],
      ["2", "Priests and marriages faulted"],
      ["3", "The messenger comes, and the tithe tested"],
      ["4", "The sun of righteousness and Elijah"],
    ],
    keyPassages: ["Mal 1:6-14", "Mal 3:1-5", "Mal 3:6-12", "Mal 4:5-6"],
  },
};
