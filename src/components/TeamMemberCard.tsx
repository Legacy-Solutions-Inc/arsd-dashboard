"use client";

export interface TeamMember {
  name: string;
  position: string;
  description: string;
  icon: React.ReactNode;
}

/** Card for displaying a leadership team member. */
export function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="text-center hover:shadow-lg transition-shadow bg-white rounded-lg">
      <div className="flex justify-center mb-4">{member.icon}</div>
      <div className="text-xl text-gray-900 font-bold">{member.name}</div>
      <div className="text-arsd-red font-medium mb-2">{member.position}</div>
      <div className="text-gray-600 px-4 pb-4">{member.description}</div>
    </div>
  );
}
