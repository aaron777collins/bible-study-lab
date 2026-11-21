import type { BookOverview } from "./types.ts";

export const NT_OVERVIEWS: Record<string, BookOverview> = {
  Matt: {
    author:
      "Traditionally attributed to Matthew, also called Levi, a tax collector who became one of the twelve apostles.",
    setting:
      "The story is set in Galilee and Judea in the early first century, among Jewish communities living under Roman rule. Many readers understand the book itself to come a few decades later, written for early groups of Jesus's followers.",
    summary:
      "Matthew presents Jesus as the promised king of Israel, the one the Hebrew scriptures point toward. Long teaching sections sit alongside stories of healing and growing conflict. It ends with Jesus crucified and raised, sending his followers to make disciples of all nations.",
    themes: [
      "Jesus fulfills the scriptures",
      "The kingdom of heaven",
      "Right living that goes deeper than rules",
      "God's welcome reaches all peoples",
    ],
    outline: [
      ["1-2", "Birth and early years of Jesus"],
      ["3-4", "John the Baptist and the start of Jesus's work"],
      ["5-7", "The Sermon on the Mount"],
      ["8-10", "Healing, calling, and sending out the twelve"],
      ["11-13", "Growing opposition and parables of the kingdom"],
      ["14-18", "Ministry around Galilee and beyond"],
      ["19-25", "Journey to Jerusalem and final teaching"],
      ["26-28", "Death and resurrection"],
    ],
    keyPassages: [
      "Matt 5:1-12",
      "Matt 11:28-30",
      "Matt 22:37-40",
      "Matt 28:18-20",
    ],
  },
  Mark: {
    author:
      "Traditionally attributed to John Mark, a younger companion of Peter and Paul, whose account is often linked with Peter's preaching.",
    setting:
      "The events unfold in Galilee, the regions around it, and Jerusalem in the early first century, under Roman rule.",
    summary:
      "Mark moves quickly from Jesus's baptism to his death and resurrection, with the question of who Jesus is pressing on every page. The disciples struggle to understand while outsiders begin to see. The empty tomb leaves readers to answer the question for themselves.",
    themes: [
      "Who is Jesus",
      "Following a suffering servant",
      "Good news for outsiders",
      "Discipleship costs something",
    ],
    outline: [
      ["1-3", "Good news begins in Galilee"],
      ["4-6", "Parables, miracles, and sending out the twelve"],
      ["7-10", "The road toward Jerusalem"],
      ["11-13", "Entry into Jerusalem and warnings about the temple"],
      ["14-16", "Death and resurrection"],
    ],
    keyPassages: [
      "Mark 1:14-15",
      "Mark 4:35-41",
      "Mark 8:27-30",
      "Mark 10:45",
      "Mark 15:33-39",
    ],
  },
  Luke: {
    author:
      "Traditionally attributed to Luke, a physician and traveling companion of Paul; the book itself names no author and is addressed to a reader called Theophilus.",
    setting:
      "The story ranges from the Jerusalem temple to Galilee and back to Jerusalem in the early first century, set against the wider Roman world.",
    summary:
      "Luke tells the story of Jesus with special attention to the overlooked, the poor, and outsiders. Prayer, the Holy Spirit, and joy in God's work run through the whole account. It ends with the risen Jesus opening the scriptures to his puzzled followers.",
    themes: [
      "Good news for the poor and overlooked",
      "The Spirit at work",
      "Joy and praise",
      "God's mercy reaches far",
      "Prayer matters",
    ],
    outline: [
      ["1-2", "Births of John and Jesus, and songs of praise"],
      ["3-4", "Baptism, testing, and the start of Jesus's work"],
      ["5-8", "Teaching and healing in Galilee"],
      ["9-19", "The long journey to Jerusalem"],
      ["20-21", "Teaching and conflict in Jerusalem"],
      ["22-23", "The last supper, trial, and crucifixion"],
      ["24", "Resurrection and the road to Emmaus"],
    ],
    keyPassages: [
      "Luke 1:46-55",
      "Luke 10:25-37",
      "Luke 15:11-32",
      "Luke 24:13-35",
    ],
  },
  John: {
    author:
      "Traditionally attributed to John, one of the twelve apostles, whom many readers identify with the unnamed disciple whom Jesus loved.",
    setting:
      "The events take place in Galilee, Judea, and above all Jerusalem across the early first century, woven around the Jewish festivals.",
    summary:
      "John builds its account around signs Jesus performed and long conversations about who he is. Again and again people must decide whether to trust him. The book states its aim plainly, that readers may believe and have life in his name.",
    themes: [
      "Signs that point to who Jesus is",
      "Life that never ends",
      "Light and darkness",
      "Belief and unbelief",
      "The Spirit as helper and guide",
    ],
    outline: [
      ["1", "The Word becomes human"],
      ["2-4", "First signs and encounters"],
      ["5-10", "Signs, debates, and the festival controversies"],
      ["11-12", "The raising of Lazarus and the final approach"],
      ["13-17", "The last supper, teaching, and prayer"],
      ["18-19", "Arrest, trial, and crucifixion"],
      ["20-21", "Resurrection appearances"],
    ],
    keyPassages: [
      "John 1:1-5",
      "John 3:16-21",
      "John 11:25-27",
      "John 14:1-6",
      "John 20:24-29",
    ],
  },
  Acts: {
    author:
      "Traditionally attributed to Luke, the same writer as the third Gospel; the book itself names no author.",
    setting:
      "The story begins in Jerusalem shortly after the events of the Gospel story and spreads through the eastern Roman world, ending in Rome itself.",
    summary:
      "Acts follows the first communities of Jesus's followers as the message spreads from Jerusalem outward through Judea, Samaria, and beyond. The Spirit drives the mission forward across old cultural lines. From midway on, the apostle Paul takes center stage, traveling widely and finally making his way to Rome as a prisoner.",
    themes: [
      "The Spirit empowers witness",
      "The message crosses every border",
      "Communities share what they have",
      "Suffering does not stop the good news",
    ],
    outline: [
      ["1-7", "The church is born in Jerusalem"],
      ["8-12", "The message spreads after Stephen's death"],
      ["13-14", "Paul's first journey with Barnabas"],
      ["15", "The council at Jerusalem"],
      ["16-20", "Journeys through Macedonia, Greece, and Asia"],
      ["21-28", "Arrest, trials, and the voyage to Rome"],
    ],
    keyPassages: [
      "Acts 1:6-8",
      "Acts 2:1-4",
      "Acts 9:1-19",
      "Acts 15:6-11",
      "Acts 16:25-34",
    ],
  },
  Rom: {
    author:
      "Traditionally attributed to Paul, written to house churches in a city he had not yet visited.",
    setting:
      "Paul writes to a network of house churches in Rome, the largest city of the Roman world, in the middle decades of the first century.",
    summary:
      "Romans is Paul's fullest statement of the good news. He argues that all people need God's mercy and that God gives right standing freely to all who trust him. He then works out what that means for daily life together and for the place of Israel in God's plan.",
    themes: [
      "All stand in need of mercy",
      "Trust, not effort, sets people right",
      "New life in the Spirit",
      "God keeps his promises",
      "Living as a sacrifice",
    ],
    outline: [
      ["1-3", "The whole world needs God's mercy"],
      ["4-5", "Trusted, and at peace"],
      ["6-8", "Free from sin, alive in the Spirit"],
      ["9-11", "Israel and God's faithfulness"],
      ["12-15", "Life together in one body"],
      ["16", "Greetings to many friends"],
    ],
    keyPassages: [
      "Rom 3:21-24",
      "Rom 5:1-5",
      "Rom 8:1-4",
      "Rom 8:31-39",
      "Rom 12:1-2",
    ],
  },
  "1Cor": {
    author:
      "Traditionally attributed to Paul, writing to a congregation he had planted in the city of Corinth.",
    setting:
      "Corinth was a busy port city in Greece, wealthy, diverse, and full of competing ideas, in the middle decades of the first century.",
    summary:
      "Paul writes to a divided congregation that had written to him with questions. He answers one problem after another, from lawsuits and immorality to worship and the resurrection. Love, he says, is the more excellent way through all of it.",
    themes: [
      "Unity in one body",
      "The wisdom of the cross",
      "Love above all gifts",
      "Bodies matter to God",
      "Hope of resurrection",
    ],
    outline: [
      ["1-4", "Division and the wisdom of the cross"],
      ["5-10", "Church problems, and freedom with limits"],
      ["11-14", "Worship, gifts, and love"],
      ["15", "The resurrection of the dead"],
      ["16", "The collection and closing words"],
    ],
    keyPassages: [
      "1Cor 1:18-25",
      "1Cor 12:12-27",
      "1Cor 13:1-13",
      "1Cor 15:3-8",
      "1Cor 15:51-57",
    ],
  },
  "2Cor": {
    author:
      "Traditionally attributed to Paul, written to the same church in Corinth during a period of strain between them.",
    setting:
      "Paul writes while working in the region between Asia and Greece, staying in touch with a congregation that had questioned him.",
    summary:
      "This is Paul's most personal letter, defending a ministry his critics found unimpressive. He speaks of weakness as the very place where God's power shows itself. He also urges the readers to finish the collection they had promised for the poor in Jerusalem.",
    themes: [
      "Strength made perfect in weakness",
      "God comforts those who suffer",
      "Giving gladly",
      "Reconciliation with God and each other",
    ],
    outline: [
      ["1-2", "Comfort in trouble, and restoring a repentant member"],
      ["3-7", "The new covenant, and treasure in clay jars"],
      ["8-9", "The collection and cheerful giving"],
      ["10-13", "Answering critics, and a visit planned"],
    ],
    keyPassages: [
      "2Cor 4:16-18",
      "2Cor 5:16-21",
      "2Cor 9:6-8",
      "2Cor 12:7-10",
    ],
  },
  Gal: {
    author:
      "Traditionally attributed to Paul, written to churches in the region of Galatia that he had helped found.",
    setting:
      "The letter is sent to several young congregations in Galatia, an inland region of Asia Minor, in the middle decades of the first century.",
    summary:
      "Paul writes in alarm because other teachers had told his readers they must add circumcision and law observance to the good news. He insists that people are set right with God by trust, not by earning it. Freedom, he argues, is given for loving service, not for self-indulgence.",
    themes: [
      "Set right by trust",
      "Freedom with responsibility",
      "The law and the promise",
      "The fruit of the Spirit",
    ],
    outline: [
      ["1", "No other good news"],
      ["2", "Standing firm in Jerusalem and Antioch"],
      ["3-4", "Promise, law, and belonging"],
      ["5", "Freedom and the Spirit's fruit"],
      ["6", "Carrying each other's burdens"],
    ],
    keyPassages: [
      "Gal 2:15-21",
      "Gal 3:26-29",
      "Gal 5:22-23",
      "Gal 6:9-10",
    ],
  },
  Eph: {
    author:
      "Traditionally attributed to Paul; some scholars propose a later writer who developed his themes for a new generation.",
    setting:
      "The letter reads like a message meant for churches across a wide region rather than one city, probably in western Asia Minor.",
    summary:
      "Ephesians opens with a wide view of what God is doing, bringing everything together under Christ. It prays for readers to grasp how loved they are. The second half turns to daily life, from marriage and family to standing firm under pressure.",
    themes: [
      "One family across old divides",
      "Saved by grace, not merit",
      "Growing into maturity",
      "Standing firm in struggle",
    ],
    outline: [
      ["1", "Chosen and blessed in Christ"],
      ["2", "Made alive, and made one"],
      ["3", "A wide purpose once hidden"],
      ["4", "One body, gifts, and a new self"],
      ["5", "Walking in love at home"],
      ["6", "Strength for the struggle, and news"],
    ],
    keyPassages: [
      "Eph 2:8-10",
      "Eph 2:11-22",
      "Eph 4:1-6",
      "Eph 6:10-18",
    ],
  },
  Phil: {
    author:
      "Traditionally attributed to Paul, written while he was imprisoned, at a point when his future was uncertain.",
    setting:
      "Paul writes from prison to a small congregation in Philippi, a Roman colony in Macedonia that he had visited on his travels.",
    summary:
      "Despite being in chains, Paul pours out joy and gratitude. He thanks the Philippians for their partnership and urges them to stay unified and humble. A song about Christ emptying himself stands at the heart of the letter.",
    themes: [
      "Joy in hard times",
      "Humility like Christ's",
      "Partnership in the good news",
      "Contentment in plenty and in want",
    ],
    outline: [
      ["1", "Chains, courage, and to live is Christ"],
      ["2", "The mind of Christ"],
      ["3", "Knowing Christ above every gain"],
      ["4", "Peace, contentment, and thanks"],
    ],
    keyPassages: [
      "Phil 2:5-11",
      "Phil 3:7-11",
      "Phil 4:4-7",
      "Phil 4:12-13",
    ],
  },
  Col: {
    author:
      "Traditionally attributed to Paul, writing with Timothy; some scholars propose a later writer working in his name.",
    setting:
      "The letter is addressed to a congregation in Colossae, a small inland town in Asia Minor in an area Paul had not personally reached.",
    summary:
      "Paul writes to believers being drawn toward extra rules, visions, and powers. Christ, he says, is supreme over all of them, and believers are already complete in him. The letter closes with practical instruction for households and work.",
    themes: [
      "Christ above every power",
      "Complete in Christ",
      "Putting off the old self",
      "Compassion at home",
    ],
    outline: [
      ["1", "The supremacy of Christ"],
      ["2", "Fullness in Christ, not in rules"],
      ["3", "Raised with Christ, clothed with love"],
      ["4", "Prayer, wisdom, and greetings"],
    ],
    keyPassages: [
      "Col 1:15-20",
      "Col 2:8-10",
      "Col 3:1-4",
      "Col 3:12-17",
    ],
  },
  "1Thess": {
    author:
      "Traditionally attributed to Paul, writing with Silvanus and Timothy to a young church he had left behind.",
    setting:
      "The readers lived in Thessalonica, the capital of Macedonia, and most of them had come to faith only recently.",
    summary:
      "Paul remembers his visit warmly and answers worries that had grown since he left, especially about believers who had died. He urges them to keep living quietly, working with their hands, and encouraging one another.",
    themes: [
      "Faith, love, and hope",
      "Comfort about those who have died",
      "Live ready, not anxious about timing",
      "Encourage one another",
    ],
    outline: [
      ["1", "A young church whose faith travels"],
      ["2-3", "Paul's care from a distance"],
      ["4", "Pleasing God, and hope for the dead"],
      ["5", "The day of the Lord, and life together"],
    ],
    keyPassages: [
      "1Thess 1:2-3",
      "1Thess 4:13-18",
      "1Thess 5:9-11",
      "1Thess 5:16-18",
    ],
  },
  "2Thess": {
    author:
      "Traditionally attributed to Paul; some scholars think it comes from his circle shortly after his lifetime.",
    setting:
      "The letter returns to the same congregation in Thessalonica, still facing pressure and confused by rumors about the end.",
    summary:
      "Paul reassures readers that the day of the Lord has not already come, whatever they may have heard. He steadies them against deception and against idleness. The closing greetings include a handwritten note meant to mark the letter as genuine.",
    themes: [
      "Steady under persecution",
      "Do not be alarmed by rumors",
      "The Lord judges justly",
      "Quiet, working faith",
    ],
    outline: [
      ["1", "Thanksgiving and encouragement under trial"],
      ["2", "The day has not yet come"],
      ["3", "Keep working, and keep praying"],
    ],
    keyPassages: [
      "2Thess 2:13-15",
      "2Thess 3:1-5",
      "2Thess 3:16-18",
    ],
  },
  "1Tim": {
    author:
      "Traditionally attributed to Paul, writing to a younger leader he mentored; some scholars date the letter to a later generation.",
    setting:
      "The letter is set in Ephesus, a great city of Asia Minor, where Timothy had been left to guide the congregation.",
    summary:
      "Paul gives Timothy practical direction for leading a church, from choosing leaders to caring for widows. He warns against speculation and greed, urging prayer and quiet godliness instead.",
    themes: [
      "Sound teaching matters",
      "Prayer for everyone",
      "Leaders of good character",
      "Contentment over love of money",
    ],
    outline: [
      ["1", "Sound teaching, and Paul's own story"],
      ["2-3", "Prayer, and choosing leaders"],
      ["4", "Train yourself in godliness"],
      ["5", "Care for widows and elders"],
      ["6", "Contentment, wealth, and the good confession"],
    ],
    keyPassages: [
      "1Tim 1:12-17",
      "1Tim 2:1-4",
      "1Tim 3:14-16",
      "1Tim 6:6-10",
    ],
  },
  "2Tim": {
    author:
      "Traditionally attributed to Paul, writing a farewell letter from prison; some scholars date it to a later generation.",
    setting:
      "Paul writes as a prisoner expecting to die, addressing Timothy as a dear son in the faith.",
    summary:
      "This is the most personal and somber of the letters to Timothy. Paul passes on the task of guarding and teaching the faith, like handing a treasure to the next runner. He asks Timothy to come soon, and to bring his coat and his scrolls.",
    themes: [
      "Fan the gift into flame",
      "Endure like a good soldier",
      "Scripture equips for good work",
      "Finish the race",
    ],
    outline: [
      ["1", "Courage, and a gift to stir up"],
      ["2", "Endure, and pass it on"],
      ["3", "Hard times, and the God-breathed writings"],
      ["4", "Finish the race, and come quickly"],
    ],
    keyPassages: [
      "2Tim 1:6-7",
      "2Tim 2:8-13",
      "2Tim 3:14-17",
      "2Tim 4:6-8",
    ],
  },
  Titus: {
    author:
      "Traditionally attributed to Paul and sent with a purpose close to 1 Timothy; some scholars date it to a later generation.",
    setting:
      "Titus is working among congregations on the island of Crete, organizing them and appointing leaders.",
    summary:
      "Paul tells Titus to appoint elders and teach each age group well, so that ordinary lives back up the message. He recalls the kindness of God that makes such lives possible. The letter closes with practical notes about travel and people.",
    themes: [
      "Grace teaches a new way to live",
      "Good lives support the message",
      "Sound teaching for every age",
      "Leaders of integrity",
    ],
    outline: [
      ["1", "Appointing elders on Crete"],
      ["2", "Teaching each group well"],
      ["3", "God's kindness, and lives that show it"],
    ],
    keyPassages: [
      "Titus 1:5-9",
      "Titus 2:11-14",
      "Titus 3:3-7",
    ],
  },
  Phlm: {
    author:
      "Traditionally attributed to Paul, writing to a householder whose home hosted a church, probably in the region of Colossae.",
    setting:
      "Paul writes from prison to Philemon about Onesimus, a man who had left Philemon's household and had since met Paul.",
    summary:
      "Onesimus has become a believer and a help to Paul, who now sends him back. Paul asks that he be welcomed as a brother rather than punished. The letter is short, warm, and quietly radical.",
    themes: [
      "A new brotherhood across social lines",
      "An appeal instead of a command",
      "Forgiveness in practice",
      "Partnership in the faith",
    ],
    outline: [["1", "A request for Onesimus"]],
    keyPassages: [
      "Phlm 1:4-7",
      "Phlm 1:8-16",
      "Phlm 1:17-21",
    ],
  },
  Heb: {
    author:
      "The author is not named in the text. From the earliest centuries readers have suggested Paul, Barnabas, Apollos, and Priscilla among others, and no proposal has won general agreement.",
    setting:
      "The letter addresses a group of believers, likely in a city, who were weary and tempted to drift away from their first confidence.",
    summary:
      "Hebrews argues at length that Christ is greater than angels, Moses, and the whole temple system. Trust and endurance are held up through a long parade of faithful figures from the scriptures. Readers are urged to keep approaching God boldly, resting on a better sacrifice.",
    themes: [
      "Christ the great high priest",
      "A better covenant",
      "Faith that endures",
      "Approach God boldly",
      "Encourage one another",
    ],
    outline: [
      ["1-2", "The Son above the angels"],
      ["3-4", "Do not shrink back from God's rest"],
      ["5-7", "A priest like Melchizedek"],
      ["8-10", "A new covenant, and one sacrifice"],
      ["11", "Faith's long witness"],
      ["12", "Endurance and discipline"],
      ["13", "Hospitality, honor, and blessing"],
    ],
    keyPassages: [
      "Heb 1:1-4",
      "Heb 4:12-13",
      "Heb 10:19-25",
      "Heb 11:1-3",
      "Heb 12:1-3",
    ],
  },
  Jas: {
    author:
      "Traditionally attributed to James, a respected leader in the Jerusalem church remembered as a kinsman of Jesus.",
    setting:
      "The letter is addressed to Jewish believers scattered among the nations, living as small communities far from Jerusalem.",
    summary:
      "James is short, vivid, and practical. It urges readers to be doers of the word and not hearers only, and it tests faith by how it treats the poor and controls the tongue. Wisdom from above, he says, shows itself in a peaceable life.",
    themes: [
      "Faith that acts",
      "Taming the tongue",
      "Wisdom from above",
      "Patience under trial",
      "No favoritism toward the rich",
    ],
    outline: [
      ["1", "Trials, hearing, and doing"],
      ["2", "Faith and works, rich and poor"],
      ["3", "The tongue, and two wisdoms"],
      ["4", "Humility and patience"],
      ["5", "Patience, prayer, and healing"],
    ],
    keyPassages: [
      "Jas 1:2-4",
      "Jas 1:19-22",
      "Jas 2:14-17",
      "Jas 3:13-18",
      "Jas 5:13-16",
    ],
  },
  "1Pet": {
    author:
      "Traditionally attributed to the apostle Peter, written through Silvanus from Rome, which the letter calls Babylon.",
    setting:
      "The readers are scattered groups of believers across parts of Asia Minor, facing social pressure and suspicion as relative newcomers.",
    summary:
      "Peter encourages believers who feel like outsiders, telling them they are a chosen people and living stones. Suffering, he says, can be borne with dignity because Christ suffered first. The letter ends with a call to humble leadership and steady hope.",
    themes: [
      "A living hope",
      "Suffering with Christ",
      "Good lives that speak for themselves",
      "Humility toward one another",
    ],
    outline: [
      ["1", "A living hope"],
      ["2", "Living stones among the nations"],
      ["3", "Gentle answers, and a clear conscience"],
      ["4", "Living for God in hard times"],
      ["5", "Shepherds, humility, and standing firm"],
    ],
    keyPassages: [
      "1Pet 1:3-9",
      "1Pet 2:4-10",
      "1Pet 2:21-25",
      "1Pet 5:6-7",
    ],
  },
  "2Pet": {
    author:
      "Traditionally attributed to the apostle Peter; some scholars date the letter later, and readers have long noted it differs in tone from 1 Peter.",
    setting:
      "The letter is written to believers in danger of being pulled loose by reckless teachers who mocked the promise of Christ's return.",
    summary:
      "Peter recalls the voice from heaven at the transfiguration and calls readers to keep growing in virtue. He warns that false teachers exploit greed and dismiss the coming judgment. The Lord's patience, he says, is not slowness but mercy.",
    themes: [
      "Grow in godliness",
      "The scriptures as a lamp",
      "False freedom is slavery",
      "The Lord is patient",
      "The day of the Lord will come",
    ],
    outline: [
      ["1", "Confirm your calling"],
      ["2", "False teachers exposed"],
      ["3", "The day of the Lord, and a new creation"],
    ],
    keyPassages: [
      "2Pet 1:3-8",
      "2Pet 1:16-21",
      "2Pet 3:8-10",
      "2Pet 3:17-18",
    ],
  },
  "1John": {
    author:
      "The author is not named in the text. From the earliest days the letter has traveled with the fourth Gospel and been linked with John the apostle.",
    setting:
      "The letter speaks to communities unsettled by a split, in which some members had left after disputes about Jesus and about how to live.",
    summary:
      "John writes so that his readers may know they have life. He gives simple tests, love for the brothers and sisters and honesty about sin, and he insists that God is light and God is love. Assurance, not anxiety, is where the letter is heading.",
    themes: [
      "God is light",
      "God is love",
      "Love shown in action",
      "Honesty about sin",
      "Assurance of eternal life",
    ],
    outline: [
      ["1", "Walking in the light together"],
      ["2", "Keeping the commands, and loving the family"],
      ["3", "Children of God love in deed"],
      ["4", "Testing the spirits, for God is love"],
      ["5", "Faith, testimony, and confidence"],
    ],
    keyPassages: [
      "1John 1:5-7",
      "1John 2:15-17",
      "1John 3:1-3",
      "1John 4:7-12",
      "1John 5:13-15",
    ],
  },
  "2John": {
    author:
      "The author is not named in the text and calls himself only the elder. From early times the letter has been linked with John and the fourth Gospel.",
    setting:
      "A short note to a congregation the elder calls the chosen lady and her children, probably a house church and its members.",
    summary:
      "The elder rejoices that some of the children are walking in truth, then urges them to keep the old command to love one another. He warns against welcoming teachers who deny that Jesus came in the flesh. Truth and love, for him, belong together.",
    themes: [
      "Truth and love together",
      "Walking in the old command",
      "Care about what you welcome",
    ],
    outline: [["1", "Truth, love, and a warning about visitors"]],
    keyPassages: [
      "2John 1:1-3",
      "2John 1:4-6",
      "2John 1:9-11",
    ],
  },
  "3John": {
    author:
      "The author is not named in the text and calls himself only the elder, as in 2 John, with the same early link to John.",
    setting:
      "A personal note to Gaius, a member of a congregation troubled by a domineering local leader named Diotrephes.",
    summary:
      "The elder praises Gaius for his hospitality toward traveling teachers. He complains that Diotrephes refuses to welcome them and says he will raise the matter in person. Demetrius, who likely carried the letter, is warmly commended.",
    themes: [
      "Hospitality keeps the mission going",
      "Faithfulness in small roles",
      "Pride disrupts a congregation",
    ],
    outline: [["1", "Praise for Gaius, and a word about two other men"]],
    keyPassages: [
      "3John 1:1-4",
      "3John 1:5-8",
      "3John 1:11-12",
    ],
  },
  Jude: {
    author:
      "Traditionally attributed to Jude, who calls himself a brother of James and is remembered as part of Jesus's wider family.",
    setting:
      "A short letter written to believers in general danger from ungodly people who had slipped into their fellowship.",
    summary:
      "Jude urges readers to fight hard for the faith handed down once for all. He paints a vivid picture of judgment using scenes from scripture and stories his readers knew. The letter ends with one of the great blessings in the New Testament.",
    themes: [
      "Hold the faith handed down",
      "Judgment is real",
      "Mercy to the wavering",
      "Kept by God",
    ],
    outline: [["1", "Contend for the faith, and a blessing"]],
    keyPassages: [
      "Jude 1:3-4",
      "Jude 1:20-21",
      "Jude 1:24-25",
    ],
  },
  Rev: {
    author:
      "Traditionally attributed to John the apostle; the writer names himself only as John, a fellow sufferer on the island of Patmos, and some readers see him as another early figure by that name.",
    setting:
      "The vision is set on Patmos, a small Aegean island, and addressed to seven actual congregations in the Roman province of Asia.",
    summary:
      "Revelation is a book of visions, full of strange images drawn from the prophets and sent to churches under pressure to compromise. Cycle after cycle shows that evil is real but doomed, and that the slain Lamb reigns. It ends with a new creation where God lives with his people.",
    themes: [
      "The Lamb who was slain reigns",
      "Stay faithful under pressure",
      "Evil will not have the last word",
      "A new creation",
      "Come, Lord Jesus",
    ],
    outline: [
      ["1", "A vision of the risen Christ"],
      ["2-3", "Letters to seven churches"],
      ["4-7", "The throne, the Lamb, and the seals"],
      ["8-11", "Trumpets and the two witnesses"],
      ["12-14", "The dragon, the beasts, and the harvest"],
      ["15-18", "Bowls of wrath, and the fall of Babylon"],
      ["19-20", "The rider on the white horse, and final judgment"],
      ["21-22", "A new heaven, a new earth, a new Jerusalem"],
    ],
    keyPassages: [
      "Rev 1:12-18",
      "Rev 5:9-10",
      "Rev 7:9-10",
      "Rev 21:1-5",
      "Rev 22:1-5",
    ],
  },
};
