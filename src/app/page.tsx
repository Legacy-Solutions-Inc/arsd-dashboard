import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Package,
  PieChart,
  TrendingUp,
} from "lucide-react";
import { createClient } from "../../supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Complete Project Control Suite
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage construction projects efficiently
              with real-time insights and comprehensive tracking.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Project KPIs Dashboard",
                description:
                  "Track contract amounts, actual vs target progress, slippage, and savings with color-coded indicators",
              },
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Interactive Gantt Charts",
                description:
                  "Visualize project timelines, task breakdowns, and progress tracking with drag-and-drop functionality",
              },
              {
                icon: <DollarSign className="w-6 h-6" />,
                title: "Cost Management",
                description:
                  "Compare target vs SWA, billed vs direct costs with monthly and quarterly reporting views",
              },
              {
                icon: <Package className="w-6 h-6" />,
                title: "Materials Tracking",
                description:
                  "Monitor requested vs received materials with filterable lists and visual donut charts",
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "S-Curve Analysis",
                description:
                  "Compare planned vs actual project completion with progress visualization over time",
              },
              {
                icon: <PieChart className="w-6 h-6" />,
                title: "Data Visualizations",
                description:
                  "Interactive charts and graphs with filtering capabilities for detailed project analysis",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border"
              >
                <div className="text-orange-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-orange-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Trusted by Construction Leaders
            </h2>
            <p className="text-orange-100 max-w-2xl mx-auto">
              Join industry professionals who rely on our platform for project
              success
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">$2B+</div>
              <div className="text-orange-100">Projects Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1,200+</div>
              <div className="text-orange-100">Active Projects</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15%</div>
              <div className="text-orange-100">Average Cost Savings</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-orange-100">On-Time Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Project Management?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Start managing your construction projects with comprehensive
            dashboards, real-time tracking, and powerful analytics.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors text-lg font-medium"
          >
            Access Your Dashboard
            <ArrowUpRight className="ml-2 w-5 h-5" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
