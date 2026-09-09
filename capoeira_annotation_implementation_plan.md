# Capoeira Annotation Web App — MVP Implementation Plan

**Timeline:** 3–4 days (quick week sprint)  
**Target:** Multi-user YouTube annotation tool with Airtable backend  
**Deployment:** Vercel or Railway (free tier)

---

## Overview

This is a web app where capoeira experts can:

1. **Select a YouTube video**  
2. **Pause at a moment** and freeze it  
3. **Write why it matters** (free text, 2–3 sentences)  
4. **Tag it** (optional, multi-select from 8 options)  
5. **Save to Airtable** (no manual export needed)  
6. **See their name recorded** with the annotation

Total build time: \~9 hours across 4 phases.

---

## Phase 0: Setup (Before Code) — 30 minutes

### Airtable Schema

Create a free Airtable workspace at [https://airtable.com](https://airtable.com)

Create one base named `capoeira-annotations` with this table:

**Table: Moments**

| Field Name | Type | Notes |
| :---- | :---- | :---- |
| id | Single line text | UUID |
| video\_id | Single line text | e.g., "ferradura-gegê" |
| video\_title | Single line text | Display name |
| timestamp | Number | Seconds into video |
| timestamp\_label | Single line text | Human-readable (e.g., "2:34") |
| expert\_name | Single line text | Who marked it |
| why\_text | Long text | Explanation (2–3 sentences) |
| tags | Multiple select | invitation, threat, redirection, pressure, deceptive, skillful, collaborative, playful |
| created\_at | Created time | Auto-populated |

**Table: Videos** (optional but recommended)

| Field Name | Type | Notes |
| :---- | :---- | :---- |
| video\_id | Single line text | Unique slug |
| video\_title | Single line text | Display name |
| youtube\_id | Single line text | YouTube ID (e.g., "T7SfSQ16wu8") |
| style | Single select | "angola", "regional", "contemporary" |
| quality | Number | 1–5 |

### Airtable API Setup

1. Go to [https://airtable.com/account/tokens](https://airtable.com/account/tokens)  
2. Create a new personal access token  
3. Scopes: `data.records:read`, `data.records:write`  
4. Copy the token  
5. Copy your **Base ID** from the URL or API docs

### Environment Variables

Create `.env.local` in your Next.js root:

NEXT\_PUBLIC\_APP\_NAME=capoeira-annotations

AIRTABLE\_TOKEN=patXXXXXXXXXXXXXXXXXX

AIRTABLE\_BASE\_ID=appXXXXXXXXXXXXXXXXXX

AIRTABLE\_MOMENTS\_TABLE=Moments

AIRTABLE\_VIDEOS\_TABLE=Videos

Create `.env.example` (no secrets):

NEXT\_PUBLIC\_APP\_NAME=capoeira-annotations

AIRTABLE\_TOKEN=your\_token\_here

AIRTABLE\_BASE\_ID=your\_base\_id\_here

AIRTABLE\_MOMENTS\_TABLE=Moments

AIRTABLE\_VIDEOS\_TABLE=Videos

### Sample Video

Upload a test video to YouTube (unlisted or public).  
Copy the video ID (e.g., `T7SfSQ16wu8` from `https://www.youtube.com/watch?v=T7SfSQ16wu8`)  
Add it to the Videos table in Airtable.

---

## Phase 1: Scaffold \+ Design System — 1–2 hours

### Initialize Next.js

npx create-next-app@latest capoeira-annotation \--typescript \--app

cd capoeira-annotation

npm install

Choose:

- TypeScript: **Yes**  
- ESLint: **Yes**  
- Tailwind: **Yes**  
- App Router: **Yes**

### Copy Design Tokens

Create `app/globals.css`:

:root {

  /\* Colors \*/

  \--ink: \#0c0a09;

  \--canvas: \#f5f5f5;

  \--on-dark: \#ffffff;

  \--soft: \#a8a29e;

  \--hairline-light: rgba(255, 255, 255, 0.16);

  \--hairline-strong: rgba(255, 255, 255, 0.30);

  

  /\* Accents \*/

  \--peach: \#f4c5a8;

  \--rose: \#e8b8c4;

  

  /\* Layout \*/

  \--side-padding: 26px;

  \--top-clearance: 84px;

  \--radius-phone: 34px;

  \--radius-pill: 9999px;

  

  /\* Typography \*/

  \--font-display: 'Bogue Black', 'Playfair Display', serif;

  \--font-body: 'Inter', sans-serif;

}

\* {

  margin: 0;

  padding: 0;

  box-sizing: border-box;

}

body {

  background: var(--canvas);

  color: var(--ink);

  font-family: var(--font-body);

  line-height: 1.5;

}

html, body, \#\_\_next {

  width: 100%;

  height: 100%;

}

### UI Primitives

Create `components/ui/Button.tsx`, `Chip.tsx`, `Textarea.tsx`:

// components/ui/Button.tsx

export function PillButton({

  children,

  onClick,

  disabled \= false,

}: {

  children: React.ReactNode;

  onClick: () \=\> void;

  disabled?: boolean;

}) {

  return (

    \<button

      onClick={onClick}

      disabled={disabled}

      style={{

        height: '50px',

        borderRadius: 'var(--radius-pill)',

        backgroundColor: disabled ? 'var(--soft)' : 'var(--canvas)',

        color: 'var(--ink)',

        border: \`1px solid var(--ink)\`,

        fontWeight: 600,

        cursor: disabled ? 'not-allowed' : 'pointer',

        fontSize: '16px',

      }}

    \>

      {children}

    \</button\>

  );

}

// components/ui/Chip.tsx

export function Chip({

  label,

  selected,

  onClick,

}: {

  label: string;

  selected: boolean;

  onClick: () \=\> void;

}) {

  return (

    \<button

      onClick={onClick}

      style={{

        height: '40px',

        borderRadius: 'var(--radius-pill)',

        backgroundColor: selected ? 'var(--canvas)' : 'transparent',

        color: 'var(--ink)',

        border: \`1px solid ${selected ? 'var(--ink)' : 'var(--soft)'}\`,

        fontWeight: selected ? 600 : 400,

        cursor: 'pointer',

        fontSize: '14px',

        padding: '0 16px',

        transition: 'all 0.2s',

      }}

    \>

      {label}

    \</button\>

  );

}

// components/ui/Textarea.tsx

export function Textarea({

  placeholder,

  value,

  onChange,

  rows \= 5,

}: {

  placeholder: string;

  value: string;

  onChange: (val: string) \=\> void;

  rows?: number;

}) {

  return (

    \<textarea

      placeholder={placeholder}

      value={value}

      onChange={(e) \=\> onChange(e.target.value)}

      rows={rows}

      style={{

        width: '100%',

        padding: '12px 16px',

        borderRadius: '8px',

        border: \`1px solid var(--soft)\`,

        fontSize: '14px',

        fontFamily: 'var(--font-body)',

        resize: 'vertical',

      }}

    /\>

  );

}

**Checkpoint:** `npm run dev` loads without errors.

---

## Phase 2: Video Player \+ Screens — 2–3 hours

### Types & Hooks

// lib/types.ts

export interface Video {

  video\_id: string;

  video\_title: string;

  youtube\_id: string;

  style: 'angola' | 'regional' | 'contemporary';

  quality?: number;

}

export type CapturePhase \= 'select' | 'playing' | 'freeze' | 'why' | 'tags' | 'done';

export interface CaptureState {

  phase: CapturePhase;

  expert\_name: string;

  selected\_video: string | null;

  frozen\_at: number | null;

  why\_text: string;

  tags: string\[\];

}

// hooks/useCaptureState.ts

import { useState, useEffect } from 'react';

import { CaptureState } from '@/lib/types';

export function useCaptureState() {

  const \[state, setState\] \= useState\<CaptureState\>({

    phase: 'select',

    expert\_name: '',

    selected\_video: null,

    frozen\_at: null,

    why\_text: '',

    tags: \[\],

  });

  const resetForNextMoment \= () \=\> {

    setState((prev) \=\> ({

      ...prev,

      phase: 'playing',

      frozen\_at: null,

      why\_text: '',

      tags: \[\],

    }));

  };

  const cancel \= () \=\> {

    setState((prev) \=\> ({

      ...prev,

      phase: 'playing',

      frozen\_at: null,

      why\_text: '',

      tags: \[\],

    }));

  };

  const setPhase \= (phase: CapturePhase) \=\> setState((prev) \=\> ({ ...prev, phase }));

  const setExpertName \= (name: string) \=\> setState((prev) \=\> ({ ...prev, expert\_name: name }));

  const setSelectedVideo \= (vid: string | null) \=\> setState((prev) \=\> ({ ...prev, selected\_video: vid }));

  const setFrozenAt \= (ts: number | null) \=\> setState((prev) \=\> ({ ...prev, frozen\_at: ts }));

  const setWhyText \= (text: string) \=\> setState((prev) \=\> ({ ...prev, why\_text: text }));

  const toggleTag \= (tag: string) \=\> {

    setState((prev) \=\> ({

      ...prev,

      tags: prev.tags.includes(tag)

        ? prev.tags.filter((t) \=\> t \!== tag)

        : \[...prev.tags, tag\],

    }));

  };

  return {

    ...state,

    setPhase,

    setExpertName,

    setSelectedVideo,

    setFrozenAt,

    setWhyText,

    toggleTag,

    resetForNextMoment,

    cancel,

  };

}

### Components

**SelectVideoScreen** — name entry \+ video picker

// components/capture/SelectVideoScreen.tsx

'use client';

import { useEffect, useState } from 'react';

import { Video } from '@/lib/types';

interface SelectVideoScreenProps {

  expert\_name: string;

  onExpertNameChange: (name: string) \=\> void;

  onSelectVideo: (videoId: string) \=\> void;

}

export function SelectVideoScreen({

  expert\_name,

  onExpertNameChange,

  onSelectVideo,

}: SelectVideoScreenProps) {

  const \[videos, setVideos\] \= useState\<Video\[\]\>(\[\]);

  const \[loading, setLoading\] \= useState(true);

  useEffect(() \=\> {

    fetch('/api/videos')

      .then((r) \=\> r.json())

      .then((data) \=\> {

        setVideos(data.videos || \[\]);

        setLoading(false);

      });

  }, \[\]);

  const handleSelect \= (videoId: string) \=\> {

    if (expert\_name.trim()) {

      onSelectVideo(videoId);

    } else {

      alert('Please enter your name first');

    }

  };

  return (

    \<div style={{ padding: 'var(--side-padding)', paddingTop: 'var(--top-clearance)', minHeight: '100vh' }}\>

      \<h1 style={{ fontSize: '32px', fontFamily: 'var(--font-display)', marginBottom: '32px' }}\>

        Annotate Capoeira

      \</h1\>

      \<div style={{ marginBottom: '32px' }}\>

        \<label style={{ display: 'block', fontSize: '12px', color: 'var(--soft)', marginBottom: '8px' }}\>

          Your name

        \</label\>

        \<input

          type="text"

          placeholder="Enter your name"

          value={expert\_name}

          onChange={(e) \=\> onExpertNameChange(e.target.value)}

          style={{

            width: '100%',

            padding: '12px 16px',

            borderRadius: '8px',

            border: \`1px solid var(--soft)\`,

            fontSize: '14px',

          }}

        /\>

      \</div\>

      \<div style={{ marginBottom: '32px' }}\>

        \<label style={{ display: 'block', fontSize: '12px', color: 'var(--soft)', marginBottom: '16px' }}\>

          Select a jogo to annotate

        \</label\>

        {loading ? (

          \<p style={{ color: 'var(--soft)' }}\>Loading videos...\</p\>

        ) : videos.length \=== 0 ? (

          \<p style={{ color: 'var(--soft)' }}\>No videos available.\</p\>

        ) : (

          \<div style={{ display: 'grid', gap: '12px' }}\>

            {videos.map((video) \=\> (

              \<button

                key={video.video\_id}

                onClick={() \=\> handleSelect(video.video\_id)}

                style={{

                  padding: '16px',

                  borderRadius: '8px',

                  border: \`1px solid var(--soft)\`,

                  backgroundColor: 'transparent',

                  cursor: 'pointer',

                  textAlign: 'left',

                }}

              \>

                \<div style={{ fontWeight: 600, fontSize: '14px' }}\>{video.video\_title}\</div\>

                \<div style={{ fontSize: '12px', color: 'var(--soft)', marginTop: '4px' }}\>{video.style}\</div\>

              \</button\>

            ))}

          \</div\>

        )}

      \</div\>

    \</div\>

  );

}

**YouTubePlayer**

// components/video/YouTubePlayer.tsx

interface YouTubePlayerProps {

  youtubeId: string;

  iframeRef?: React.RefObject\<HTMLIFrameElement\>;

  frozenAt?: number | null;

}

export function YouTubePlayer({ youtubeId, iframeRef, frozenAt }: YouTubePlayerProps) {

  return (

    \<div

      style={{

        position: 'relative',

        width: '100%',

        aspectRatio: '16 / 9',

        backgroundColor: '\#000',

        borderRadius: 'var(--radius-phone)',

        overflow: 'hidden',

        marginBottom: '16px',

      }}

    \>

      \<iframe

        ref={iframeRef}

        width="100%"

        height="100%"

        src={\`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1\&controls=1\`}

        title="Capoeira jogo"

        frameBorder="0"

        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"

        allowFullScreen

      /\>

      {frozenAt \!== null && (

        \<div

          style={{

            position: 'absolute',

            top: '10px',

            left: '10px',

            backgroundColor: 'rgba(0, 0, 0, 0.7)',

            color: 'white',

            padding: '8px 12px',

            borderRadius: '4px',

            fontSize: '12px',

            fontWeight: 600,

          }}

        \>

          Frozen at {Math.floor(frozenAt / 60)}:{(frozenAt % 60).toString().padStart(2, '0')}

        \</div\>

      )}

    \</div\>

  );

}

**PlayingScreen**

// components/capture/PlayingScreen.tsx

interface PlayingScreenProps {

  videoTitle: string;

  onFreeze: (timestamp: number) \=\> void;

  onCancel: () \=\> void;

}

export function PlayingScreen({ videoTitle, onFreeze, onCancel }: PlayingScreenProps) {

  const \[currentTime, setCurrentTime\] \= useState(0);

  return (

    \<div style={{ padding: 'var(--side-padding)', paddingTop: '16px', minHeight: '100vh' }}\>

      \<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}\>

        \<h2 style={{ fontSize: '16px', fontWeight: 600 }}\>{videoTitle}\</h2\>

        \<button

          onClick={onCancel}

          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}

        \>

          ✕

        \</button\>

      \</div\>

      \<button

        onClick={() \=\> onFreeze(currentTime)}

        style={{

          width: '100%',

          height: '50px',

          borderRadius: 'var(--radius-pill)',

          backgroundColor: 'var(--canvas)',

          border: \`2px solid var(--ink)\`,

          cursor: 'pointer',

          fontWeight: 600,

          fontSize: '16px',

          marginTop: '32px',

        }}

      \>

        ❌ Freeze This Moment

      \</button\>

    \</div\>

  );

}

**FreezeScreen** — timestamp display

// components/capture/FreezeScreen.tsx

interface FreezeScreenProps {

  timestamp: number;

}

export function FreezeScreen({ timestamp }: FreezeScreenProps) {

  const formatTime \= (secs: number) \=\> {

    const mins \= Math.floor(secs / 60);

    const sec \= Math.floor(secs % 60);

    return \`${mins}:${sec.toString().padStart(2, '0')}\`;

  };

  return (

    \<div

      style={{

        position: 'fixed',

        top: 0,

        left: 0,

        right: 0,

        bottom: 0,

        backgroundColor: 'rgba(0, 0, 0, 0.5)',

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

      }}

    \>

      \<div

        style={{

          backgroundColor: 'var(--canvas)',

          borderRadius: 'var(--radius-phone)',

          padding: '32px',

          textAlign: 'center',

        }}

      \>

        \<div style={{ fontSize: '14px', color: 'var(--soft)', marginBottom: '8px' }}\>Frozen at\</div\>

        \<div style={{ fontSize: '48px', fontWeight: 600, marginBottom: '32px' }}\>

          {formatTime(timestamp)}

        \</div\>

        \<p style={{ fontSize: '12px', color: 'var(--soft)' }}\>Getting ready for your annotation…\</p\>

      \</div\>

    \</div\>

  );

}

**WhyScreen**

// components/capture/WhyScreen.tsx

import { Textarea } from '@/components/ui/Textarea';

interface WhyScreenProps {

  whyText: string;

  onWhyTextChange: (text: string) \=\> void;

  onNext: () \=\> void;

  onCancel: () \=\> void;

}

export function WhyScreen({ whyText, onWhyTextChange, onNext, onCancel }: WhyScreenProps) {

  return (

    \<div style={{ padding: 'var(--side-padding)', paddingTop: 'var(--top-clearance)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}\>

      \<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}\>

        \<h2 style={{ fontSize: '16px', fontWeight: 600 }}\>Why it matters\</h2\>

        \<button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}\>

          ✕

        \</button\>

      \</div\>

      \<label style={{ fontSize: '12px', color: 'var(--soft)', marginBottom: '12px', textTransform: 'uppercase' }}\>

        In your own words

      \</label\>

      \<Textarea

        placeholder="What does this moment reveal about the game? (2–3 sentences)"

        value={whyText}

        onChange={onWhyTextChange}

        rows={6}

      /\>

      \<div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingBottom: '32px' }}\>

        \<button onClick={onCancel} style={{ flex: 1, height: '50px', borderRadius: 'var(--radius-pill)', backgroundColor: 'transparent', border: \`1px solid var(--soft)\`, cursor: 'pointer', fontWeight: 600 }}\>

          Cancel

        \</button\>

        \<button onClick={onNext} style={{ flex: 1, height: '50px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--canvas)', border: \`1px solid var(--ink)\`, cursor: 'pointer', fontWeight: 600 }}\>

          Next

        \</button\>

      \</div\>

    \</div\>

  );

}

**TagsScreen** (Multi-Select)

// components/capture/TagsScreen.tsx

import { Chip } from '@/components/ui/Chip';

const TAG\_OPTIONS \= \[

  { label: 'Invitation', value: 'invitation' },

  { label: 'Threat', value: 'threat' },

  { label: 'Redirection', value: 'redirection' },

  { label: 'Pressure', value: 'pressure' },

  { label: 'Deceptive', value: 'deceptive' },

  { label: 'Skillful', value: 'skillful' },

  { label: 'Collaborative', value: 'collaborative' },

  { label: 'Playful', value: 'playful' },

\];

interface TagsScreenProps {

  selectedTags: string\[\];

  onToggleTag: (tag: string) \=\> void;

  onNext: () \=\> void;

  onSkip: () \=\> void;

  onCancel: () \=\> void;

}

export function TagsScreen({ selectedTags, onToggleTag, onNext, onSkip, onCancel }: TagsScreenProps) {

  return (

    \<div style={{ padding: 'var(--side-padding)', paddingTop: 'var(--top-clearance)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}\>

      \<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}\>

        \<h2 style={{ fontSize: '16px', fontWeight: 600 }}\>What kind of moment?\</h2\>

        \<button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}\>

          ✕

        \</button\>

      \</div\>

      \<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}\>

        {TAG\_OPTIONS.map((tag) \=\> (

          \<Chip

            key={tag.value}

            label={tag.label}

            selected={selectedTags.includes(tag.value)}

            onClick={() \=\> onToggleTag(tag.value)}

          /\>

        ))}

      \</div\>

      \<div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingBottom: '32px' }}\>

        \<button onClick={onSkip} style={{ flex: 1, height: '50px', borderRadius: 'var(--radius-pill)', backgroundColor: 'transparent', border: \`1px solid var(--soft)\`, cursor: 'pointer', fontWeight: 600 }}\>

          Skip

        \</button\>

        \<button onClick={onNext} style={{ flex: 1, height: '50px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--canvas)', border: \`1px solid var(--ink)\`, cursor: 'pointer', fontWeight: 600 }}\>

          Next

        \</button\>

      \</div\>

    \</div\>

  );

}

**DoneScreen**

// components/capture/DoneScreen.tsx

interface DoneScreenProps {

  momentLabel: string;

  onMarkAnother: () \=\> void;

  onResumeJogo: () \=\> void;

}

export function DoneScreen({ momentLabel, onMarkAnother, onResumeJogo }: DoneScreenProps) {

  return (

    \<div style={{ padding: 'var(--side-padding)', paddingTop: 'var(--top-clearance)', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}\>

      \<div style={{ fontSize: '48px', marginBottom: '16px' }}\>✓\</div\>

      \<h1 style={{ fontSize: '24px', fontFamily: 'var(--font-display)', marginBottom: '8px' }}\>Saved\</h1\>

      \<p style={{ fontSize: '14px', color: 'var(--soft)', marginBottom: '48px' }}\>

        Your annotation at {momentLabel} has been sent.

      \</p\>

      \<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: 'auto', paddingBottom: '32px' }}\>

        \<button onClick={onMarkAnother} style={{ height: '50px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--canvas)', border: \`1px solid var(--ink)\`, cursor: 'pointer', fontWeight: 600 }}\>

          Mark Another Moment

        \</button\>

        \<button onClick={onResumeJogo} style={{ height: '50px', borderRadius: 'var(--radius-pill)', backgroundColor: 'transparent', border: \`1px solid var(--soft)\`, cursor: 'pointer', fontWeight: 600 }}\>

          Resume the Jogo

        \</button\>

      \</div\>

    \</div\>

  );

}

**Checkpoint:** Flow through all screens (select → playing → freeze → why → tags → done). No API calls yet.

---

## Phase 3: Airtable API Integration — 2 hours

### API Routes

// app/api/videos/route.ts

import { NextResponse } from 'next/server';

export async function GET() {

  const token \= process.env.AIRTABLE\_TOKEN;

  const baseId \= process.env.AIRTABLE\_BASE\_ID;

  if (\!token || \!baseId) {

    return NextResponse.json({ error: 'Airtable credentials missing' }, { status: 500 });

  }

  try {

    const response \= await fetch(

      \`https://api.airtable.com/v0/${baseId}/Videos\`,

      { headers: { Authorization: \`Bearer ${token}\` } }

    );

    if (\!response.ok) throw new Error(\`Airtable error: ${response.statusText}\`);

    const data \= await response.json();

    const videos \= data.records.map((record: any) \=\> ({

      video\_id: record.fields.video\_id,

      video\_title: record.fields.video\_title,

      youtube\_id: record.fields.youtube\_id,

      style: record.fields.style,

    }));

    return NextResponse.json({ videos });

  } catch (error) {

    console.error('Fetch videos error:', error);

    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });

  }

}

// app/api/moments/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {

  const token \= process.env.AIRTABLE\_TOKEN;

  const baseId \= process.env.AIRTABLE\_BASE\_ID;

  if (\!token || \!baseId) {

    return NextResponse.json({ error: 'Airtable credentials missing' }, { status: 500 });

  }

  try {

    const body \= await request.json();

    const record \= {

      fields: {

        id: uuidv4(),

        video\_id: body.video\_id,

        video\_title: body.video\_title,

        timestamp: body.timestamp,

        timestamp\_label: body.timestamp\_label,

        expert\_name: body.expert\_name,

        why\_text: body.why\_text,

        tags: body.tags || \[\],

      },

    };

    const response \= await fetch(

      \`https://api.airtable.com/v0/${baseId}/Moments\`,

      {

        method: 'POST',

        headers: {

          Authorization: \`Bearer ${token}\`,

          'Content-Type': 'application/json',

        },

        body: JSON.stringify({ records: \[record\] }),

      }

    );

    if (\!response.ok) {

      const errorData \= await response.json();

      console.error('Airtable error:', errorData);

      throw new Error(\`Airtable error: ${response.statusText}\`);

    }

    const data \= await response.json();

    return NextResponse.json({ success: true, record: data.records\[0\] });

  } catch (error) {

    console.error('Save moment error:', error);

    return NextResponse.json({ error: 'Failed to save moment' }, { status: 500 });

  }

}

### Install UUID

npm install uuid

npm install \-D @types/uuid

**Checkpoint:** Mark a moment, fill answers, hit "Mark Another Moment", verify row in Airtable.

---

## Phase 4: Main Page \+ Error Handling — 1 hour

// app/page.tsx

'use client';

import { useEffect, useState } from 'react';

import { useCaptureState } from '@/hooks/useCaptureState';

import { SelectVideoScreen } from '@/components/capture/SelectVideoScreen';

import { PlayingScreen } from '@/components/capture/PlayingScreen';

import { FreezeScreen } from '@/components/capture/FreezeScreen';

import { WhyScreen } from '@/components/capture/WhyScreen';

import { TagsScreen } from '@/components/capture/TagsScreen';

import { DoneScreen } from '@/components/capture/DoneScreen';

import { YouTubePlayer } from '@/components/video/YouTubePlayer';

export default function Home() {

  const capture \= useCaptureState();

  const \[videos, setVideos\] \= useState\<any\[\]\>(\[\]);

  const \[selectedVideoData, setSelectedVideoData\] \= useState\<any\>(null);

  const \[toastMessage, setToastMessage\] \= useState('');

  const \[showToast, setShowToast\] \= useState(false);

  useEffect(() \=\> {

    fetch('/api/videos')

      .then((r) \=\> r.json())

      .then((data) \=\> setVideos(data.videos || \[\]));

  }, \[\]);

  useEffect(() \=\> {

    if (capture.selected\_video) {

      const video \= videos.find((v) \=\> v.video\_id \=== capture.selected\_video);

      setSelectedVideoData(video);

    }

  }, \[capture.selected\_video, videos\]);

  // Auto-advance from freeze to why after 1.15s

  useEffect(() \=\> {

    if (capture.phase \=== 'freeze') {

      const timer \= setTimeout(() \=\> {

        capture.setPhase('why');

      }, 1150);

      return () \=\> clearTimeout(timer);

    }

  }, \[capture.phase\]);

  const handleFreeze \= (timestamp: number) \=\> {

    capture.setFrozenAt(timestamp);

    capture.setPhase('freeze');

  };

  const handleSave \= async () \=\> {

    if (\!selectedVideoData || capture.frozen\_at \=== null) return;

    const formatTime \= (secs: number) \=\> {

      const mins \= Math.floor(secs / 60);

      const sec \= Math.floor(secs % 60);

      return \`${mins}:${sec.toString().padStart(2, '0')}\`;

    };

    const record \= {

      video\_id: capture.selected\_video,

      video\_title: selectedVideoData.video\_title,

      timestamp: Math.round(capture.frozen\_at),

      timestamp\_label: formatTime(capture.frozen\_at),

      expert\_name: capture.expert\_name,

      why\_text: capture.why\_text,

      tags: capture.tags,

    };

    try {

      const response \= await fetch('/api/moments', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(record),

      });

      if (response.ok) {

        setToastMessage('Annotation saved ✓');

        setShowToast(true);

        setTimeout(() \=\> setShowToast(false), 2000);

        capture.resetForNextMoment();

      } else {

        setToastMessage('Failed to save. Try again.');

        setShowToast(true);

      }

    } catch (error) {

      setToastMessage('Network error. Check your connection.');

      setShowToast(true);

    }

  };

  if (capture.phase \=== 'select') {

    return (

      \<SelectVideoScreen

        expert\_name={capture.expert\_name}

        onExpertNameChange={capture.setExpertName}

        onSelectVideo={(vid) \=\> {

          capture.setSelectedVideo(vid);

          capture.setPhase('playing');

        }}

      /\>

    );

  }

  return (

    \<div\>

      {selectedVideoData && (

        \<YouTubePlayer

          youtubeId={selectedVideoData.youtube\_id}

          frozenAt={capture.frozen\_at}

        /\>

      )}

      {capture.phase \=== 'playing' && (

        \<PlayingScreen

          videoTitle={selectedVideoData?.video\_title || 'Video'}

          onFreeze={handleFreeze}

          onCancel={() \=\> {

            capture.setSelectedVideo(null);

            capture.setPhase('select');

          }}

        /\>

      )}

      {capture.phase \=== 'freeze' && capture.frozen\_at \!== null && (

        \<FreezeScreen timestamp={capture.frozen\_at} /\>

      )}

      {capture.phase \=== 'why' && (

        \<WhyScreen

          whyText={capture.why\_text}

          onWhyTextChange={capture.setWhyText}

          onNext={() \=\> capture.setPhase('tags')}

          onCancel={capture.cancel}

        /\>

      )}

      {capture.phase \=== 'tags' && (

        \<TagsScreen

          selectedTags={capture.tags}

          onToggleTag={capture.toggleTag}

          onNext={() \=\> {

            handleSave();

          }}

          onSkip={() \=\> {

            handleSave();

          }}

          onCancel={capture.cancel}

        /\>

      )}

      {capture.phase \=== 'done' && capture.frozen\_at \!== null && (

        \<DoneScreen

          momentLabel={\`${Math.floor(capture.frozen\_at / 60)}:${(capture.frozen\_at % 60).toString().padStart(2, '0')}\`}

          onMarkAnother={() \=\> {

            capture.resetForNextMoment();

          }}

          onResumeJogo={() \=\> {

            capture.setSelectedVideo(null);

            capture.setPhase('select');

          }}

        /\>

      )}

      {showToast && (

        \<div

          style={{

            position: 'fixed',

            bottom: '32px',

            left: '50%',

            transform: 'translateX(-50%)',

            backgroundColor: toastMessage.includes('✓') ? '\#1a7f16' : '\#c5192d',

            color: 'white',

            padding: '12px 16px',

            borderRadius: '8px',

            fontSize: '14px',

            zIndex: 1000,

          }}

        \>

          {toastMessage}

        \</div\>

      )}

    \</div\>

  );

}

**Checkpoint:** End-to-end flow. Mark a moment, answer questions, save to Airtable. Verify in Airtable.

---

## Testing Checklist

- [ ] Video selector loads  
- [ ] Can enter name and select video  
- [ ] Freeze button freezes at current time  
- [ ] Freeze screen shows timestamp  
- [ ] Why screen collects text  
- [ ] Tags screen allows multi-select  
- [ ] "Mark Another Moment" saves to Airtable  
- [ ] Verify all fields in Airtable (timestamp, why\_text, tags, expert\_name)  
- [ ] Cancel works at every step  
- [ ] Error handling on API failures

---

## Deployment

\# Push to GitHub

git add .

git commit \-m "MVP capoeira annotation app"

git push origin main

\# Deploy to Vercel

\# Go to vercel.com/new → Connect repo → Add env vars → Deploy

---

## Success Criteria

✓ Expert can select video and enter name  
✓ Expert can freeze moment  
✓ Expert can write explanation  
✓ Expert can optionally tag  
✓ Data saves to Airtable  
✓ Multiple experts can use the same tool

**Ship this. Add student overlays and AI features after MVP is collecting real data.**  
