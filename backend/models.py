"""Data objects shared by the tools and the agent."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Course(BaseModel):
    """One row of the courses table (only the fields we use)."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    number: str = Field(alias="course_number")
    title: str = Field(alias="course_title")
    section: str = ""
    category: str = Field(default="", alias="course_category")
    course_type: str = ""
    session: str = Field(default="", alias="course_session")
    daytimes: str = ""
    room: str = ""
    units: str = ""
    faculty: str = Field(default="", alias="faculty_1")
    description: str = Field(default="", alias="course_description")
    faculty_bio: str = ""

    @field_validator("*", mode="before")
    @classmethod
    def _none_to_blank(cls, v):
        return "" if v is None else v


class CourseHit(BaseModel):
    """What search_courses hands back to the model: descriptions and bios are clipped."""

    number: str
    title: str
    section: str
    category: str
    course_type: str
    session: str
    daytimes: str
    room: str
    units: str
    faculty: str
    description: str
    faculty_bio: str


class SearchResult(BaseModel):
    total_matches: int
    shown: int
    courses: list[CourseHit]


class AgentResult(BaseModel):
    reply: str
    tools_used: list[str] = Field(default_factory=list)
