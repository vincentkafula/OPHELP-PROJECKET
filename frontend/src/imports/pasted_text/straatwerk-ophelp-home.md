Below is a developer specification for the Straatwerk OPHELP Web Application Home Page. It incorporates the information visible in the attached Straatwerk website, including its mission, history, ministries, and the OPHELP programme, while presenting your proposed cash voucher system as a new digital service. The mission, history, and programme descriptions are based on the attached Straatwerk homepage.

Straatwerk OPHELP Voucher System
Home Page - UI/UX & Developer Specification
Project Overview

The OPHELP Voucher System is a digital platform developed for Straatwerk, a registered Non-Profit Organisation dedicated to serving people in distress, restoring dignity through honest work, and demonstrating Christ's love through practical ministry. The platform digitizes the OPHELP work programme by managing participants, work shifts, digital payments, and OPHELP payment cards.

Overall Theme
Design Style

Modern

Professional

Faith-based

Clean

Warm

Accessible

Responsive

Large typography

Rounded cards

Soft shadows

Easy navigation

Colour Palette

Primary Green
#2E7D32

Primary Blue
#1565C0

Gold Accent
#F9A825

Background
#F5F7FA

White Cards
#FFFFFF

Dark Text
#1F2937

Success Green
#4CAF50

Danger
#E53935

Navigation Bar

Logo (Straatwerk)

Home

About Straatwerk

OPHELP Programme

Work Opportunities

Partner Shops

ATM Locations

Dashboard

Donate

Contact

Login

Register

Sticky navigation with transparent background that changes to white when scrolling.

Hero Section
Background

A full-width banner showing:

Volunteers working with participants
Participants cleaning streets or community spaces
A participant receiving an OPHELP card
A participant withdrawing cash from an ATM
Partner shop accepting an OPHELP card

Overlay:
Green transparent gradient

Hero Text
Restoring Dignity Through Honest Work

The OPHELP Voucher System empowers participants to earn income through approved work opportunities. After completing a four-hour shift, earnings are loaded securely onto an OPHELP Card, which can be used at supported ATMs and participating partner shops.

Buttons:

Get Started

View Work Opportunities

About Straatwerk

Include a section summarizing the organisation:

Founded in the late 1960s by young people concerned for those rejected by society.
Today registered as both an NPO and a Public Benefit Organisation.
Focused on serving people in distress and showing Christ's love through practical outreach.

Display statistics from the site:

60+ Years in Ministry
10,000+ Lives Touched
200,000+ VTJ dolls distributed
650+ OPHELP Participants
Mission Section

Use icon cards highlighting Straatwerk's mission:

❤️ Show Christ's love

🤝 Serve those in need

📢 Speak up for those who have no voice

🌍 Serve people regardless of race, age, religion, culture, or sexual orientation

Include the verse reference from the website (Proverbs 31:8–9) and the statement that the ministry team reflects South Africa's diversity.

OPHELP Workflow

Display as a horizontal timeline with icons:

1. Register

Participant receives an OPHELP account and card.

↓

2. Work

Participant completes a scheduled 4-hour work shift.

↓

3. Supervisor Approval

Supervisor confirms attendance and work completion.

↓

4. Digital Payment

System loads earnings onto the participant's OPHELP card.

↓

5. Spend or Withdraw

Participant can:

Withdraw money from supported ATMs
Purchase goods at approved partner shops
Features Section

Grid layout (3 × 2 cards):

👤 Participant Registration

🕒 Shift Scheduling

✅ Shift Approval

💳 Digital Voucher Payments

🏧 ATM Withdrawals

🛒 Partner Shop Payments

Live Dashboard Preview

Display sample dashboard cards:

Active Participants

Today's Shifts

Approved Payments

Pending Approvals

Partner Shops

ATM Locations

Monthly Payments

Recent Transactions

Ministries Section

Display cards for Straatwerk's ministries:

Ministry to the Destitute and Desperate

Prostitution Prevention and Restoration

Servant Evangelism

Each card links to the relevant information pages.

Donate Section

Display a large green donation panel:

Your Giving Changes Lives

Explain that donations help:

Street outreach
Training and honest work through OPHELP
Women rebuilding their lives
Ministry teams serving communities

Include a "Donate Now" button.

Photo Gallery

Use a masonry layout with captions such as:

Street Outreach

Community Work

Volunteer Teams

Prayer

Training

OPHELP Participants

Footer

Include:

About

Ministries

Donate

Contact

Telephone

Email

NPO Number

Banking Details

Social Media Links

These items are listed on the Straatwerk homepage footer.

Graphic Design Guide for Developers
Homepage Layout
----------------------------------------------------
| Navigation Bar                                   |
----------------------------------------------------

| HERO IMAGE                                      |
| "Restoring Dignity Through Honest Work"         |
| [Get Started] [View Work Opportunities]         |

----------------------------------------------------

| About Straatwerk                               |
| History + Statistics                           |

----------------------------------------------------

| Mission Cards                                  |
| ❤️ 🤝 📢 🌍                                   |

----------------------------------------------------

| How OPHELP Works                               |
| Register → Work → Approve → Pay → Spend        |

----------------------------------------------------

| Features                                       |
| Registration | Payments | Cards                |
| Shops | ATMs | Reports                         |

----------------------------------------------------

| Dashboard Preview                              |

----------------------------------------------------

| Ministries                                     |

----------------------------------------------------

| Donate                                         |

----------------------------------------------------

| Gallery                                        |

----------------------------------------------------

| Footer                                         |
----------------------------------------------------
UI Components
Rounded cards (16 px radius)
Large buttons (48 px height)
Green gradient headers
Soft shadows
Material Design icons
Mobile-first responsive layout
WCAG AA color contrast
Consistent spacing using an 8 px grid
Suggested Technology Stack

Frontend

React.js (Next.js)
Tailwind CSS
Material UI
Framer Motion (animations)
Chart.js (statistics)

Backend

ASP.NET Core Web API (or Laravel if preferred)
PostgreSQL or SQL Server
JWT authentication
RESTful APIs

Payments

OPHELP Card integration layer
ATM transaction API (subject to banking partner availability)
Partner shop merchant API

Security

HTTPS
Role-based access control (Administrator, Supervisor, Participant)
Audit logs
Encrypted card and transaction data
Note for developers

The proposed OPHELP card payment flow, ATM withdrawals, and partner shop integrations are application requirements and will require integration with a card issuer or payment provider. The attached Straatwerk website confirms the existence of the OPHELP programme and its role in providing training and honest work, but it does not describe the technical implementation of a payment card or voucher platform.