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
  Table,
  TableCell,
  TableBody,
  TableHead,
  TableRow,
  useAuthenticator,
  View
} from '@aws-amplify/ui-react';
import moment from "moment";

const client = generateClient<Schema>();

function App() {
  const [telemetries, setTelemetry] = useState<Array<Schema["telemetry"]["type"]>>([]);
  const [devices, setDevices] = useState<Array<Schema["devices"]["type"]>>([]);

  const { user, signOut } = useAuthenticator();

  useEffect(() => {
    client.models.telemetry.observeQuery().subscribe({
      next: (data) => { setTelemetry([...data.items]) },
    });

    client.models.devices.observeQuery().subscribe({
      next: (data) => { setDevices([...data.items]) },
    });

  }, []);


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

  function createTelemetry() {
    const temperature = Math.random() * (30 - 20) + 20;
    const humidity = Math.random() * (90 - 40) + 40;

    client.models.telemetry.create({
      device_id: "1234",
      timestamp: new Date().getTime(),
      temperature: temperature,
      humidity: humidity,
      owner: user.userId,
    });
  }

  return (
    <main>

      <Heading
        width='30vw'
        level={5} >
        User: {user?.signInDetails?.loginId}
      </Heading>
      <Heading
        width='30vw'
        level={5} >
        Temperature: {telemetries[telemetries.length - 1]?.temperature} 
      </Heading>
      <Heading
        width='30vw'
        level={5} >
        Humidity: {telemetries[telemetries.length - 1]?.humidity} 
      </Heading>
      <Heading
        width='30vw'
        level={5} >
        Updated: {moment(telemetries[telemetries.length - 1]?.timestamp).fromNow()}
      </Heading>


      <Divider padding="xs" />
      <h3>Devices</h3>
      {
        <Button
          variation="primary"
          loadingText=""
          onClick={createDevice}
        >
          Add Device
        </Button>
      }
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
                Last Seen:
                {item?.last_seen}
              </Flex>
              <Flex>
                Status:
                <Badge variation="success" key={item.device_id}>
                  {item?.status}
                </Badge>
              </Flex>
              <Divider padding="xs" />
              <Heading padding="medium">ID: {item.device_id}</Heading>
              <Button variation="destructive" isFullWidth onClick={() => deleteDevice(item.device_id)}>
                Delete
              </Button>
            </View>
          </Card>
        )}
      </Collection>

      <Divider padding="xs" />
      <h3>Telemetry</h3>
      {
        <Button
          variation="primary"
          loadingText=""
          onClick={createTelemetry}
        >
          Create new Telemetry record
        </Button>
      }

      <Table
        caption="Telemetries"
        highlightOnHover={true}
        variation="striped">
        <TableHead>
          <TableRow>
            <TableCell as="th">Device ID</TableCell>
            <TableCell as="th">Temperature</TableCell>
            <TableCell as="th">Humidity</TableCell>
            <TableCell as="th">Delete</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {telemetries.map((tel, index) => (
            <TableRow key={index}>
              <TableCell>{tel.device_id}</TableCell>
              <TableCell>{tel?.temperature}</TableCell>
              <TableCell>{tel?.humidity}</TableCell>
              <TableCell>
                <Button
                  variation="primary"
                  colorTheme="error"
                  onClick={() => deleteTelemetry(tel.device_id, tel.timestamp)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Divider padding="xs" />
      <button onClick={signOut}>Sign out</button>
    </main >
  );
}

export default App;
