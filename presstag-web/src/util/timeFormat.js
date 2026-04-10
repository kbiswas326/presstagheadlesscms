const IST_TIME_ZONE = 'Asia/Kolkata';

export const formatDate = (dateString) => {
  if (!dateString) return "No Date";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    return new Intl.DateTimeFormat("en-US", {
      timeZone: IST_TIME_ZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "Invalid Date";
  }
};

export const formatPublishDateTime = (publishDate, publishTime, fallbackDateString) => {
  try {
    if (publishDate && publishTime) {
      const dateObj = new Date(publishDate);
      const [hours, minutes] = String(publishTime).split(':');
      if (!isNaN(dateObj.getTime()) && hours != null && minutes != null) {
        dateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return new Intl.DateTimeFormat("en-US", {
          timeZone: IST_TIME_ZONE,
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(dateObj);
      }
    }
  } catch {}

  return formatDate(fallbackDateString);
};
