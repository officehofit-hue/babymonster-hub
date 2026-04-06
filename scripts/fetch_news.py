"""
BABYMONSTER Hub — Daily News Fetcher
Fetches latest news and updates from multiple sources.
Runs via GitHub Actions on a daily schedule.
"""

import json
import os
import re
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html import unescape

# === CONFIG ===
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'news.json')

YOUTUBE_CHANNEL_ID = 'UCalp0m2HzeK_ExBqCDfTsdA'  # BABYMONSTER official
YOUTUBE_RSS = f'https://www.youtube.com/feeds/videos.xml?channel_id={YOUTUBE_CHANNEL_ID}'

MEMBERS = ['Ruka', 'Pharita', 'Asa', 'Haram', 'Rora', 'Chiquita', 'Ahyeon']

# Google News RSS search queries
NEWS_QUERIES = [
    'BABYMONSTER+kpop',
    'BABYMONSTER+YG+Entertainment',
    'BABYMONSTER+comeback',
]

SOCIAL_LINKS = {
    'YouTube': 'https://www.youtube.com/@BABYMONSTER_',
    'Instagram': 'https://www.instagram.com/babymonster_yg/',
    'X / Twitter': 'https://x.com/YGBABYMONSTER_',
    'TikTok': 'https://www.tiktok.com/@babymonster_yg',
    'Weverse': 'https://weverse.io/babymonster',
    'Facebook': 'https://www.facebook.com/BABYMONSTER.YGOfficial',
}


def fetch_url(url, timeout=15):
    """Fetch URL content with proper headers."""
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; BABYMONSTERHub/1.0; +https://github.com)'
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read().decode('utf-8', errors='replace')
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        print(f'  [WARN] Failed to fetch {url}: {e}')
        return None


def fetch_youtube_videos():
    """Fetch latest videos from BABYMONSTER YouTube via RSS."""
    print('[YouTube] Fetching latest videos...')
    articles = []

    xml_data = fetch_url(YOUTUBE_RSS)
    if not xml_data:
        return articles

    try:
        root = ET.fromstring(xml_data)
        ns = {
            'atom': 'http://www.w3.org/2005/Atom',
            'media': 'http://search.yahoo.com/mrss/',
            'yt': 'http://www.youtube.com/xml/schemas/2015'
        }

        for entry in root.findall('atom:entry', ns)[:5]:
            title = entry.find('atom:title', ns)
            published = entry.find('atom:published', ns)
            video_id = entry.find('yt:videoId', ns)
            media_group = entry.find('media:group', ns)
            description = ''
            if media_group is not None:
                desc_elem = media_group.find('media:description', ns)
                if desc_elem is not None and desc_elem.text:
                    description = desc_elem.text[:300]

            if title is not None and video_id is not None:
                vid_id = video_id.text
                pub_date = ''
                if published is not None and published.text:
                    try:
                        dt = datetime.fromisoformat(published.text.replace('Z', '+00:00'))
                        pub_date = dt.strftime('%B %d, %Y')
                    except ValueError:
                        pub_date = published.text[:10]

                members = detect_members(title.text + ' ' + description)

                articles.append({
                    'source': 'YouTube',
                    'title': clean_text(title.text),
                    'summary': clean_text(description) if description else f'New video from BABYMONSTER on YouTube.',
                    'date': pub_date,
                    'members': members,
                    'image': f'https://img.youtube.com/vi/{vid_id}/maxresdefault.jpg',
                    'url': f'https://www.youtube.com/watch?v={vid_id}'
                })

        print(f'  [YouTube] Found {len(articles)} videos')
    except ET.ParseError as e:
        print(f'  [WARN] YouTube XML parse error: {e}')

    return articles


def fetch_google_news():
    """Fetch BABYMONSTER news articles from Google News RSS."""
    print('[News] Fetching articles...')
    articles = []
    seen_titles = set()

    for query in NEWS_QUERIES:
        url = f'https://news.google.com/rss/search?q={query}&hl=en&gl=US&ceid=US:en'
        xml_data = fetch_url(url)
        if not xml_data:
            continue

        try:
            root = ET.fromstring(xml_data)
            for item in root.findall('.//item')[:5]:
                title_elem = item.find('title')
                pub_date_elem = item.find('pubDate')
                link_elem = item.find('link')
                desc_elem = item.find('description')

                if title_elem is None or title_elem.text is None:
                    continue

                title_text = clean_text(title_elem.text)

                # Skip duplicates
                title_lower = title_text.lower()
                if title_lower in seen_titles:
                    continue
                seen_titles.add(title_lower)

                # Skip if not actually about BABYMONSTER
                if 'babymonster' not in title_lower and 'baby monster' not in title_lower:
                    continue

                pub_date = ''
                if pub_date_elem is not None and pub_date_elem.text:
                    try:
                        dt = datetime.strptime(pub_date_elem.text, '%a, %d %b %Y %H:%M:%S %Z')
                        pub_date = dt.strftime('%B %d, %Y')
                    except ValueError:
                        pub_date = pub_date_elem.text[:16]

                link = link_elem.text if link_elem is not None else ''

                summary = ''
                if desc_elem is not None and desc_elem.text:
                    summary = clean_html(desc_elem.text)[:300]

                if not summary:
                    summary = f'Latest news article about BABYMONSTER.'

                members = detect_members(title_text + ' ' + summary)

                articles.append({
                    'source': 'Article',
                    'title': title_text,
                    'summary': summary,
                    'date': pub_date,
                    'members': members,
                    'image': '',
                    'url': link
                })
        except ET.ParseError as e:
            print(f'  [WARN] News XML parse error: {e}')

    print(f'  [News] Found {len(articles)} articles')
    return articles


def detect_members(text):
    """Detect which members are mentioned in the text."""
    text_lower = text.lower()
    found = [m for m in MEMBERS if m.lower() in text_lower]
    return found if found else ['Group']


def clean_text(text):
    """Clean and normalize text."""
    if not text:
        return ''
    text = unescape(text)
    text = re.sub(r'<[^>]+>', '', text)  # strip HTML tags
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def clean_html(html_text):
    """Remove HTML tags and decode entities."""
    text = re.sub(r'<[^>]+>', ' ', html_text)
    text = unescape(text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def build_quick_updates(articles):
    """Generate quick updates from recent articles."""
    updates = []
    for a in articles[:5]:
        members = a.get('members', ['BABYMONSTER'])
        who = members[0] if members[0] != 'Group' else 'BABYMONSTER'
        source = a.get('source', 'unknown')

        what_map = {
            'YouTube': f'posted a new video on YouTube',
            'Instagram': f'shared a new post on Instagram',
            'X / Twitter': f'posted an update on X',
            'TikTok': f'uploaded a new TikTok',
            'Weverse': f'posted on Weverse',
            'Article': f'was featured in a news article',
            'Facebook': f'updated their Facebook page',
        }

        updates.append({
            'who': who,
            'what': what_map.get(source, f'new update on {source}'),
            'when': a.get('date', 'recently')
        })

    return updates


def build_gallery(articles):
    """Build gallery items from articles that have images."""
    gallery = []
    for a in articles:
        if a.get('image'):
            member = a['members'][0].lower() if a['members'][0] != 'Group' else 'group'
            gallery.append({
                'image': a['image'],
                'caption': a['title'][:60],
                'member': member
            })

    # If not enough, add placeholders
    if len(gallery) < 8:
        for m in MEMBERS:
            gallery.append({
                'image': '',
                'caption': f'{m} — Latest',
                'member': m.lower()
            })
            if len(gallery) >= 12:
                break

    return gallery[:16]


def main():
    print('=' * 50)
    print('BABYMONSTER Hub — Daily News Fetcher')
    print(f'Running at: {datetime.now(timezone.utc).isoformat()}')
    print('=' * 50)

    all_articles = []

    # Fetch from all sources
    all_articles.extend(fetch_youtube_videos())
    all_articles.extend(fetch_google_news())

    # Sort by date (most recent first)
    all_articles.sort(key=lambda a: a.get('date', ''), reverse=True)

    # Remove duplicates by similar titles
    seen = set()
    unique_articles = []
    for a in all_articles:
        key = re.sub(r'[^a-z0-9]', '', a['title'].lower())[:50]
        if key not in seen:
            seen.add(key)
            unique_articles.append(a)

    # Pick trending
    trending = ''
    if unique_articles:
        trending = f"LATEST: {unique_articles[0]['title']}"

    # Build output
    output = {
        'last_updated': datetime.now(timezone.utc).isoformat(),
        'trending': trending,
        'articles': unique_articles[:30],
        'quick_updates': build_quick_updates(unique_articles),
        'gallery': build_gallery(unique_articles)
    }

    # Write to file
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f'\nDone! Saved {len(unique_articles)} articles to {OUTPUT_FILE}')
    print(f'Trending: {trending}')


if __name__ == '__main__':
    main()
