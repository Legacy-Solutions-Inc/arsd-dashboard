// 'use client';

// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Badge } from '@/components/ui/badge';
// import { 
//   Play, 
//   CheckCircle, 
//   AlertCircle, 
//   Loader2, 
//   RefreshCw,
//   Database
// } from 'lucide-react';

// export function AutoParseManager() {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);
//   const [lastParseResult, setLastParseResult] = useState<any>(null);

//   const triggerAutoParse = async () => {
//     setLoading(true);
//     setError(null);
//     setSuccess(null);

//     try {
//       const response = await fetch('/api/accomplishment-reports/parse-approved', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.error || 'Failed to trigger auto-parse');
//       }

//       setLastParseResult(result);
//       setSuccess(result.message);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Unknown error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Card className="mb-6">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <Database className="h-5 w-5 text-blue-600" />
//           Auto-Parse Manager
//         </CardTitle>
//         <CardDescription>
//           Manually trigger parsing of approved accomplishment reports
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <div className="flex gap-4">
//           <Button
//             onClick={triggerAutoParse}
//             disabled={loading}
//             className="bg-blue-600 hover:bg-blue-700"
//           >
//             {loading ? (
//               <>
//                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                 Parsing...
//               </>
//             ) : (
//               <>
//                 <Play className="h-4 w-4 mr-2" />
//                 Parse Approved Reports
//               </>
//             )}
//           </Button>
//         </div>

//         {error && (
//           <Alert variant="destructive">
//             <AlertCircle className="h-4 w-4" />
//             <AlertDescription>{error}</AlertDescription>
//           </Alert>
//         )}

//         {success && (
//           <Alert className="border-green-200 bg-green-50">
//             <CheckCircle className="h-4 w-4 text-green-600" />
//             <AlertDescription className="text-green-800">{success}</AlertDescription>
//           </Alert>
//         )}

//         {lastParseResult && (
//           <div className="bg-blue-50 p-4 rounded-lg">
//             <h4 className="font-semibold text-blue-800 mb-2">Last Parse Result:</h4>
//             <div className="text-sm text-blue-700">
//               <p>Parsed: {lastParseResult.parsed} reports</p>
//               <p>Total: {lastParseResult.total} approved reports</p>
//               {lastParseResult.errors && lastParseResult.errors.length > 0 && (
//                 <div className="mt-2">
//                   <p className="font-semibold">Errors:</p>
//                   <ul className="list-disc list-inside">
//                     {lastParseResult.errors.map((error: string, index: number) => (
//                       <li key={index} className="text-red-600">{error}</li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
