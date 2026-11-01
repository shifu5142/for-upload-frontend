import type { Attachment, Category, Playbook, WorkspaceData } from "@/lib/workspace/types";

function file(id: string, name: string): Attachment {
  return { id, name };
}

function playbook(
  id: string,
  name: string,
  icon: Playbook["icon"],
  prompt: string,
  extras: Partial<Playbook> = {},
): Playbook {
  return {
    id,
    name,
    icon,
    prompt,
    description: extras.description ?? "",
    active: extras.active ?? true,
    autoSend: extras.autoSend ?? false,
    attachments: extras.attachments ?? [],
  };
}

const playbooks: Playbook[] = [
  playbook(
    "pb-consult",
    "התייעץ על סוג הודעה",
    "messages",
    "קרא את השיחה הנוכחית עם הלקוח.\n\nעזור לי לבחור את סוג ההודעה הבא. החזר המלצה קצרה בעברית: המלצה ראשית, למה, ומה לא לשלוח עכשיו.\nאל תכתוב עדיין את ההודעה ללקוח.",
    { description: "בחירת סוג ההודעה הבאה לפני ניסוח" },
  ),
  playbook(
    "pb-certificate",
    "תעודת סיום קורס ותועלות",
    "graduation",
    "כתוב הודעת המשך קצרה על תעודת הסיום ועל התועלות המעשיות של הקורס.\nהתבסס על השיחה, והדגש מה הלקוח מרוויח בפועל.",
  ),
  playbook(
    "pb-lecturers-dev",
    "מרצים - מפתחי AI",
    "users",
    "המסמך המצורף מתאר את המרצים ממסלול מפתחי AI.\nכתוב הודעת המשך קצרה שמתאימה ללקוח בשיחה, בלי להעתיק את המסמך כמו שהוא.",
    { attachments: [file("file-dev", "מרצים - מפתחי AI.docx")] },
  ),
  playbook(
    "pb-lecturers-eng",
    "מרצים - מהנדסי AI",
    "users",
    "המסמך המצורף מתאר את המרצים ממסלול מהנדסי AI.\nכתוב הודעת המשך קצרה שמתאימה ללקוח בשיחה.",
    { attachments: [file("file-eng", "מרצים - מהנדסי AI.docx")] },
  ),
  playbook(
    "pb-placement",
    "מידע על הליווי וההשמה",
    "briefcase",
    "כתוב הודעה קצרה על הליווי ועל ההשמה אחרי הקורס.\nהתאם את הניסוח למה שהלקוח שאל בשיחה.",
  ),
  playbook(
    "pb-pain-dream",
    "סיכום שיחה לפי כאב וחלום",
    "heart",
    "סכם את השיחה לפי הכאב של הלקוח והחלום שלו.\nהחזר הודעת סיכום קצרה בעברית, בגוף ראשון של הנציגה, בלי שפה שיווקית מוגזמת.",
  ),
  playbook(
    "pb-testimonials",
    "סרטוני ממליצים ובוגרים",
    "sparkles",
    "הצע איך לשלוח סרטוני ממליצים ובוגרים, ונסח הודעה קצרה שמזמינה את הלקוח לצפות.",
    { active: false, description: "מוסתר כרגע מהתוסף" },
  ),
  playbook(
    "pb-needs",
    "שאלות בירור צרכים",
    "search",
    "הכן לי 6 שאלות בירור קצרות לשיחה הקרובה.\nהשאלות צריכות לחשוף רקע, מטרה, חסם ולוח זמנים. החזר רשימה שאפשר להקריא.",
  ),
  playbook(
    "pb-demo-biz-tech",
    "דוגמה למערכת - בעל עסק עם רקע טכנולוגי",
    "briefcase",
    "הצע דוגמת מערכת שאפשר לבנות בקורס, לבעל עסק עם רקע טכנולוגי.\nהסבר בקצרה איך להציג אותה בשיחה.",
  ),
  playbook(
    "pb-demo-biz-notechn",
    "דוגמה למערכת - בעל עסק בלי רקע טכנולוגי",
    "lightbulb",
    "הצע דוגמת מערכת פשוטה להצגה לבעל עסק בלי רקע טכנולוגי.\nהשפה צריכה להיות יומיומית, בלי מונחים מיותרים.",
  ),
  playbook(
    "pb-demo-emp-tech",
    "דוגמה למערכת - שכיר עם רקע טכנולוגי",
    "target",
    "הצע דוגמת מערכת לשכיר עם רקע טכנולוגי, ואיך לקשור אותה לקידום בעבודה.",
  ),
  playbook(
    "pb-demo-emp-notechn",
    "דוגמה למערכת - שכיר בלי רקע טכנולוגי",
    "clipboard",
    "הצע דוגמת מערכת לשכיר בלי רקע טכנולוגי.\nהדגש שהדוגמה נגישה ושאפשר להגיע אליה במהלך הקורס.",
  ),
  playbook(
    "pb-benefits",
    "איך להציג את היתרונות",
    "check",
    "תן לי ניסוח קצר להצגת יתרונות הקורס, מותאם למה שחשוב ללקוח בשיחה הזו.\nעד 5 נקודות, בשפה מדוברת.",
  ),
  playbook(
    "pb-course-goal",
    "איך להציג את מטרת הקורס",
    "target",
    "נסח איך להציג את מטרת הקורס במשפטים קצרים, בלי להציף את הלקוח.",
  ),
  playbook(
    "pb-expensive",
    "טיפול בהתנגדות: יקר מדי",
    "shield",
    "הלקוח אומר שהקורס יקר מדי.\nהמסמך המצורף הוא שיטת הטיפול. השתמש בו כבסיס, והתאם תשובה קצרה ללקוח ולשיחה.",
    {
      attachments: [file("file-expensive", "טיפול בהתנגדות יקר מדי.docx")],
      description: "כולל מסמך שיטת טיפול",
    },
  ),
  playbook(
    "pb-no-time",
    "טיפול בהתנגדות: אין לי זמן",
    "clock",
    "הלקוח אומר שאין לו זמן או שהוא עמוס מדי.\nהתבסס על המסמך המצורף, והחזר תשובה קצרה שאפשר לומר בשיחה.",
    { attachments: [file("file-time", "טיפול בהתנגדות אין לי זמן.docx")] },
  ),
  playbook(
    "pb-think",
    "טיפול בהתנגדות: רוצה לחשוב על זה",
    "clock",
    "הלקוח רוצה לחשוב על זה. החזר תשובה רגועה שמשאירה פתח ולא לוחצת, לפי שיטת הטיפול.",
    { attachments: [file("file-think", "טיפול בהתנגדות אני צריך לחשוב על זה.docx")] },
  ),
  playbook(
    "pb-consult-other",
    "טיפול בהתנגדות: רוצה להתייעץ",
    "users",
    "הלקוח רוצה להתייעץ עם מישהו נוסף. הצע ניסוח שמכבד את זה וקובע צעד הבא ברור.",
  ),
  playbook(
    "pb-recovery",
    "הצילו, הלקוח מתרחק",
    "alert",
    "הלקוח מתרחק או מתקרר. תן לי משפט פתיחה אחד ותגובה קצרה שמחזירה את השיחה בלי לחץ.",
    { description: "כשהשיחה מאבדת את הלקוח" },
  ),
  playbook(
    "pb-learn-alone",
    "טיפול בהתנגדות: רוצה ללמוד לבד",
    "search",
    "הלקוח אומר שהוא רוצה ללמוד לבד באינטרנט. החזר תשובה קצרה שמסבירה את הערך של ליווי, בלי לזלזל.",
    { active: false },
  ),
  playbook(
    "pb-crm",
    "הכנת תיעוד שיחה ל-CRM",
    "file",
    "הכן תיעוד שיחה קצר ל-CRM לפי השיחה: סטטוס, כאב, חסם, צעד הבא, ותאריך פולואפ אם עלה.",
    { autoSend: true, description: "נשלח אוטומטית אחרי בחירת הפעולה" },
  ),
  playbook(
    "pb-followup",
    "הכנת תסריט שיחת פולואפ",
    "phone",
    "כתוב תסריט קצר לשיחת פולואפ: פתיחה, שאלה אחת, חיבור למה שדובר, ובקשה לסגירת צעד.",
  ),
  playbook(
    "pb-missing-deal",
    "מה אני מפספסת בעסקה?",
    "lightbulb",
    "קרא את השיחה וציין מה חסר כדי להבין את העסקה: מי מקבל החלטה, תקציב, דחיפות, ומה עוד לא נשאל.",
  ),
  playbook(
    "pb-missing-close",
    "מה חסר לי כדי לסגור אותו?",
    "target",
    "לפי השיחה, מה חסר כדי לסגור? החזר עד 4 פערים ומה לשאול או לשלוח עכשיו.",
  ),
  playbook(
    "pb-not-answering",
    "הלקוח לא עונה / איך נכון לפנות אליו",
    "send",
    "הלקוח לא עונה. המלץ על ערוץ אחד (הודעה, תמונה או הקלטה קולית) ונסח את הפנייה הבאה.",
  ),
  playbook(
    "pb-voice",
    "תסריט הודעה קולית עד 25 שניות",
    "mic",
    "כתוב תסריט להודעה קולית של עד 25 שניות. שפה מדוברת, משפט פתיחה, ערך אחד, ושאלה בסוף.",
    { autoSend: true },
  ),
];

const categories: Category[] = [
  {
    id: "cat-summary",
    name: "סיכום שיחה / הודעות המשך",
    icon: "messages",
    active: true,
    playbookIds: [
      "pb-consult",
      "pb-certificate",
      "pb-lecturers-dev",
      "pb-lecturers-eng",
      "pb-placement",
      "pb-pain-dream",
      "pb-testimonials",
    ],
  },
  {
    id: "cat-prep",
    name: "הכנה לשיחה",
    icon: "clipboard",
    active: true,
    playbookIds: [
      "pb-needs",
      "pb-demo-biz-tech",
      "pb-demo-biz-notechn",
      "pb-demo-emp-tech",
      "pb-demo-emp-notechn",
      "pb-benefits",
      "pb-course-goal",
    ],
  },
  {
    id: "cat-during",
    name: "במהלך שיחה",
    icon: "shield",
    active: true,
    playbookIds: [
      "pb-expensive",
      "pb-no-time",
      "pb-think",
      "pb-consult-other",
      "pb-recovery",
      "pb-learn-alone",
    ],
  },
  {
    id: "cat-after",
    name: "אחרי שיחה",
    icon: "file",
    active: true,
    playbookIds: [
      "pb-crm",
      "pb-followup",
      "pb-missing-deal",
      "pb-missing-close",
      "pb-not-answering",
      "pb-voice",
    ],
  },
];

export const initialWorkspace: WorkspaceData = {
  categories,
  playbooks: Object.fromEntries(playbooks.map((item) => [item.id, item])),
};

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}
