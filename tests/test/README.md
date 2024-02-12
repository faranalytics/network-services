# Test

Run the tests using the following instructions.

## Instructions

### Clone the Network-Services repo.
```bash
git clone https://github.com/faranalytics/network-services.git
```
### Change directory into the root directory.
```bash
cd network-services
```
### Install dependencies.
```bash
npm install && npm update
```
### Build *Network-Services*.
```bash
npm run clean:build
```
### Run the tests.
```bash
npm test
```
#### Output
```bash
▶ Test variations of uni-directional and bi-directional methods calls.
  ✔ Call a method that echos a string. (208.397141ms)
  ✔ Call a nested method and echo a string. (163.14154ms)
  ✔ Call a nested method that is defined in the super class and echo a string. (151.341852ms)
  ✔ Call a method that echos multiple arguments as an array of the arguments. (385.847622ms)
  ✔ Call echoString multiple times synchronously and asynchronously await their results. (342.564604ms)
  ✔ Call a method that bi-directionally calls another method. (2.091564ms)
  ✔ Call a method that throws an error. (2.192924ms)
  ✔ Call a method that bi-directionally calls another method that throws an Error. (1.484037ms)
  ✔ Call a nested method that throws an Error. (0.531516ms)
  ▶ Test subversive method calls.
    ✔ Call a method that is not a defined property path. (0.883157ms)
    ✔ Call an undefined method. (0.523912ms)
    ✔ Call a method on a function object. (0.337521ms)
    ✔ Make a call that exceeds the queue size limit. (77.582189ms)
  ▶ Test subversive method calls. (80.027425ms)

▶ Test variations of uni-directional and bi-directional methods calls. (1345.886891ms)

▶ Test bi-directional calls over a stream.Duplex in object mode.
  ✔ Call a method that bi-directionally calls another method. (2.486688ms)
▶ Test bi-directional calls over a stream.Duplex in object mode. (4.438868ms)

ℹ tests 14
ℹ suites 3
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1586.025893
```