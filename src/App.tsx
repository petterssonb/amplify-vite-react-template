import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

import {
  Badge,
  Button,
  Card,
  Collection,
  Divider,
  Flex,
  Heading,
  useAuthenticator,
  View,
  ThemeProvider,
  defaultTheme
} from '@aws-amplify/ui-react';
import moment from "moment";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const client = generateClient<Schema>();

function App() {
  const [telemetries, setTelemetry] = useState<Array<Schema["telemetry"]["type"]>>([]);
  const [devices, setDevices] = useState<Array<Schema["devices"]["type"]>>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  const { user, signOut } = useAuthenticator();

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDevice(event.target.value);
  };

  const filteredTelemetries = telemetries.filter(
    (data) => data.device_id === selectedDevice
  );

  useEffect(() => {
    client.models.telemetry.observeQuery({}).subscribe({
      next: (data) => { setTelemetry([...data.items]) },
    });

  }, []);

  useEffect(() => {
    client.models.devices.observeQuery().subscribe({
      next: (data) => { setDevices([...data.items]) },
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
  
      devices.forEach((device) => {
        const lastTelemetry = telemetries
          .filter((tel) => tel.device_id === device.device_id)
          .sort((a, b) => b.timestamp - a.timestamp)[0];
  
        if (lastTelemetry) {
          const timeDiff = now - lastTelemetry.timestamp;
  
          const newStatus = timeDiff > 65000 ? "offline" : "online";
  
          if (device.status !== newStatus) {
            client.models.devices.update({
              device_id: device.device_id,
              status: newStatus,
              owner: user.userId,
            });
            if (newStatus === "offline") {
              setNotifications((prev) => [
                ...prev,
                `Device ${device.device_id} went offline.`,
              ]);
            }
          }
        }
      });
    }, 3000);
  
    return () => clearInterval(interval);
  }, [devices, telemetries]);

  function createDevice() {
    const device = String(window.prompt("Device ID"));
    client.models.devices.create({ device_id: device, owner: user.userId })
  }

  function deleteDevice(device_id: string) {
    client.models.devices.delete({ device_id })
  }

  function deleteTelemetry(device_id: string, timestamp: number) {
    client.models.telemetry.delete({ device_id, timestamp })
  }

  const [notifications, setNotifications] = useState<string[]>([]);

  const chartOptions = {

    onClick: function (evt: any, element: string | any[]) {
      evt;
      if (element.length > 0) {
        var ind = element[0].index;
        deleteTelemetry(telemetries[ind].device_id, telemetries[ind].timestamp)
      }
    },

    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    stacked: false,
    plugins: {
      title: {
        display: true,
        text: telemetries[0]?.device_id ? telemetries[0].device_id : "",
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
      }
    },
  };

  const customTheme = {
    ...defaultTheme,
    name: 'custom-theme',
    tokens: {
      components: {
        button: {
          primary: {
            backgroundColor: { value: 'purple' },
            color: { value: 'white' },
            _hover: {
              backgroundColor: { value: 'darkviolet' },
            },
            fontSize: { value: '1rem' },
            padding: { value: '0.75rem 1.5rem' },
          },
        },
      },
    },
  };


  const cartData = {
    labels: filteredTelemetries.map((data) =>
      moment(data?.timestamp).format("HH:mm:ss")
    ),
    datasets: [
      {
        label: "Temperature",
        data: filteredTelemetries.map((data) => data?.temperature),
        borderColor: "rgba(128, 0, 128, 1)",
        backgroundColor: "rgba(128, 0, 128, 0.5)",
        yAxisID: "y",
      },
      {
        label: "Humidity",
        data: filteredTelemetries.map((data) => data?.humidity),
        borderColor: "rgba(75, 0, 130, 1)",
        backgroundColor: "rgba(75, 0, 130, 0.5)",
        yAxisID: "y1",
      },
    ],
  };

  return (
    <main>
      <Heading
        width="30vw"
        level={5}
      >
        User: {user?.signInDetails?.loginId}
      </Heading>
      <Heading
        width="30vw"
        level={5}
      >
        Temperature: {telemetries[telemetries.length - 1]?.temperature}
      </Heading>
      <Heading
        width="30vw"
        level={5}
      >
        Humidity: {telemetries[telemetries.length - 1]?.humidity}
      </Heading>
  
      <Divider padding="xs" />
      <h3>Select Device</h3>
      <select
        onChange={handleDeviceChange}
        value={selectedDevice}
      >
        <option value="">-- Select a Device --</option>
        {devices.map((device) => (
          <option key={device.device_id} value={device.device_id}>
            {device.device_id}
          </option>
        ))}
      </select>
      
      <Divider padding="xs" />

      <div style={{ position: "fixed", top: "10px", right: "10px", zIndex: 1000 }}>
      {notifications.map((message, index) => (
        <div
          key={index}
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "10px",
            marginBottom: "5px",
            borderRadius: "5px",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {message}
          <button
            style={{
              marginLeft: "10px",
              backgroundColor: "white",
              color: "red",
              border: "none",
              cursor: "pointer",
              borderRadius: "3px",
            }}
            onClick={() => {
              // Remove the notification
              setNotifications((prev) =>
                prev.filter((_, idx) => idx !== index)
              );
            }}
          >
            Close
          </button>
        </div>
      ))}
    </div>
      
      <h3>Devices</h3>
      <ThemeProvider theme={customTheme}>
        <Button
          variation="primary"
          loadingText=""
          onClick={createDevice}
        >
          Add Device
        </Button>
      </ThemeProvider>
      
      <Divider padding="xs" />
  
      <Collection
      items={devices}
      type="list"
      direction="row"
      gap="20px"
      wrap="nowrap"
    >
      {(item, index) => (
        <Card
          key={index}
          borderRadius="medium"
          maxWidth="20rem"
          variation="outlined"
        >
          <View padding="xs">
            <Flex>
              Last Seen:{" "}
              {telemetries
                .filter((tel) => tel.device_id === item.device_id)
                .sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp
                ? moment(
                    telemetries
                      .filter((tel) => tel.device_id === item.device_id)
                      .sort((a, b) => b.timestamp - a.timestamp)[0].timestamp
                  ).fromNow()
                : "No data"}
            </Flex>
            <Flex>
              Status:
              <Badge
                variation={item.status === "online" ? "success" : "error"}
              >
                {item.status
                  ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
                  : "Unknown"}
              </Badge>
            </Flex>
            <Divider padding="xs" />
            <Heading padding="medium">ID: {item.device_id}</Heading>
            <Button
              variation="destructive"
              isFullWidth
              onClick={() => deleteDevice(item.device_id)}
            >
              Delete
            </Button>
          </View>
        </Card>
      )}
    </Collection>
  
      <Divider padding="xs" />
      <h3>Telemetry</h3>
      <Line options={chartOptions} data={cartData}></Line>
  
      <Divider padding="xs" />
      <button
        onClick={signOut}
        style={{
          backgroundColor: "black",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          transition: "background-color 0.3s ease",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = "purple";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.backgroundColor = "black";
        }}
      >
        Sign out
      </button>
    </main>
  );}

export default App;