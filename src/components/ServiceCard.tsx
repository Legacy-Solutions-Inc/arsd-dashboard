"use client";

export interface Service {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  image: string;
}

/** Card for displaying a service. */
export function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="hover:shadow-lg transition-shadow bg-white rounded-lg">
      <div className="flex flex-col items-center p-6">
        <div className="mb-4">{service.icon}</div>
        <div className="text-2xl text-gray-900 font-bold mb-2">{service.title}</div>
        <p className="text-gray-600 mb-6 text-center">{service.description}</p>
        <ul className="space-y-3">
          {service.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0">✔</span>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
